'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameSocket } from '@/lib/socketClient';

interface PeerConnection {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
  iceCandidateQueue: RTCIceCandidateInit[];
  remoteDescriptionSet: boolean;
  retryCount: number;
}

interface VoicePeer {
  id: string;
  name: string;
  stream: MediaStream;
  isSpeaking: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Free TURN servers for devices behind symmetric NATs (mobile networks etc.)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 4,
};

const MAX_PEER_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function useVoiceChat(
  socket: GameSocket | null,
  myId: string,
  lobbyCode: string | null,
  players: { id: string; name: string }[]
) {
  const [isMuted, setIsMuted] = useState(true); // start muted
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([]);
  const [micError, setMicError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const makingOfferRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playersRef = useRef(players);
  const socketRef = useRef(socket);

  // Keep refs up to date
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // Helper: ensure AudioContext is running (browsers suspend it until user gesture)
  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  }, []);

  // Helper: flush queued ICE candidates once remote description is set
  const flushIceCandidates = useCallback(async (peer: PeerConnection) => {
    while (peer.iceCandidateQueue.length > 0) {
      const candidate = peer.iceCandidateQueue.shift()!;
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Error adding queued ICE candidate:', err);
      }
    }
  }, []);

  // Cleanup all peer connections
  const cleanupPeers = useCallback(() => {
    peersRef.current.forEach(({ pc }) => {
      pc.close();
    });
    peersRef.current.clear();
    makingOfferRef.current.clear();
    analysersRef.current.clear();
    setVoicePeers([]);
  }, []);

  // Cleanup everything
  const cleanupAll = useCallback(() => {
    cleanupPeers();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }

    setIsVoiceEnabled(false);
    setIsMuted(true);
    setMicError(null);
  }, [cleanupPeers]);

  // Create peer connection for a remote user
  const createPeerConnection = useCallback(
    (remoteId: string): PeerConnection => {
      // Close any existing connection for this peer first
      const existing = peersRef.current.get(remoteId);
      if (existing) {
        existing.pc.close();
        peersRef.current.delete(remoteId);
        analysersRef.current.delete(remoteId);
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      const remoteStream = new MediaStream();

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      const peerConn: PeerConnection = {
        pc,
        remoteStream,
        iceCandidateQueue: [],
        remoteDescriptionSet: false,
        retryCount: 0,
      };

      // Handle incoming remote tracks — use event.track directly (not event.streams[0])
      // Some browsers don't associate the track with a stream
      pc.ontrack = (event) => {
        // Add the track directly to our managed remoteStream
        remoteStream.addTrack(event.track);

        // Handle track ending — remove from stream
        event.track.onended = () => {
          remoteStream.removeTrack(event.track);
        };

        // Set up audio analyser for speaking detection
        try {
          const ac = ensureAudioContext();
          const source = ac.createMediaStreamSource(remoteStream);
          const analyser = ac.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          analysersRef.current.set(remoteId, analyser);
        } catch {
          // Ignore analyser errors — not critical for audio playback
        }

        // Update peers list
        const player = playersRef.current.find(p => p.id === remoteId);
        setVoicePeers(prev => {
          const existingIdx = prev.findIndex(p => p.id === remoteId);
          if (existingIdx >= 0) {
            // Update existing peer's stream
            const updated = [...prev];
            updated[existingIdx] = { ...updated[existingIdx], stream: remoteStream };
            return updated;
          }
          return [...prev, {
            id: remoteId,
            name: player?.name || 'Unknown',
            stream: remoteStream,
            isSpeaking: false,
          }];
        });
      };

      // Send ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          // @ts-expect-error - custom signaling event
          socketRef.current.emit('webrtc-ice-candidate', {
            targetId: remoteId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Handle connection state changes — retry failed connections
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`WebRTC ${remoteId.slice(0, 6)}: ${state}`);

        if (state === 'failed') {
          // Retry the connection if under max retries
          const peer = peersRef.current.get(remoteId);
          if (peer && peer.retryCount < MAX_PEER_RETRIES && localStreamRef.current) {
            peer.retryCount++;
            console.log(`Retrying connection to ${remoteId.slice(0, 6)} (attempt ${peer.retryCount})`);
            pc.close();
            peersRef.current.delete(remoteId);
            analysersRef.current.delete(remoteId);

            // Retry after a short delay
            setTimeout(() => {
              if (!localStreamRef.current || !socketRef.current) return;
              const newPeer = createPeerConnection(remoteId);
              newPeer.retryCount = peer.retryCount;
              initiateOffer(remoteId, newPeer);
            }, RETRY_DELAY_MS);
          } else {
            // Give up — remove peer
            peersRef.current.delete(remoteId);
            analysersRef.current.delete(remoteId);
            setVoicePeers(prev => prev.filter(p => p.id !== remoteId));
          }
        } else if (state === 'disconnected') {
          // Wait briefly — might recover on its own
          setTimeout(() => {
            if (pc.connectionState === 'disconnected') {
              // Still disconnected — try ICE restart
              pc.restartIce();
            }
          }, 3000);
        }
      };

      // Handle ICE connection state for additional diagnostics
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          // Try ICE restart before giving up
          pc.restartIce();
        }
      };

      peersRef.current.set(remoteId, peerConn);
      return peerConn;
    },
    [ensureAudioContext]
  );

  // Helper: create and send an offer to a remote peer
  const initiateOffer = useCallback(async (remoteId: string, peer: PeerConnection) => {
    if (!socketRef.current) return;
    try {
      makingOfferRef.current.add(remoteId);
      const offer = await peer.pc.createOffer({
        offerToReceiveAudio: true,
      });
      await peer.pc.setLocalDescription(offer);

      // @ts-expect-error - custom signaling event
      socketRef.current.emit('webrtc-offer', {
        targetId: remoteId,
        offer: peer.pc.localDescription,
      });
    } catch (err) {
      console.warn('Error creating offer for peer:', err);
    } finally {
      makingOfferRef.current.delete(remoteId);
    }
  }, []);

  // Enable voice chat
  const enableVoice = useCallback(async () => {
    try {
      setMicError(null);

      // Resume AudioContext (needs user gesture)
      ensureAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;

      // Start muted
      stream.getAudioTracks().forEach(t => { t.enabled = false; });

      setIsVoiceEnabled(true);
      setIsMuted(true);

      // Tell other players in the lobby we're ready for voice
      if (socket && lobbyCode) {
        // @ts-expect-error - custom signaling event
        socket.emit('voice-join', { lobbyCode });
      }
    } catch (err) {
      console.error('Mic access error:', err);
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setMicError('Microphone permission denied. Please allow mic access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setMicError('No microphone found. Please connect a microphone and try again.');
        } else if (err.name === 'NotReadableError') {
          setMicError('Microphone is in use by another app. Close other apps using the mic and try again.');
        } else {
          setMicError(`Microphone error: ${err.message}`);
        }
      } else {
        setMicError('Could not access microphone. Please allow mic permission and try again.');
      }
    }
  }, [socket, lobbyCode, ensureAudioContext]);

  // Disable voice chat
  const disableVoice = useCallback(() => {
    if (socket && lobbyCode) {
      // @ts-expect-error - custom signaling event
      socket.emit('voice-leave', { lobbyCode });
    }
    cleanupAll();
  }, [socket, lobbyCode, cleanupAll]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const newMuted = !isMuted;
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !newMuted;
      });
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  // Set up socket listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    // "Perfect negotiation" – use ID comparison to decide politeness.
    // The peer with the lexicographically smaller ID is "polite" and will
    // roll back its own offer when it receives a conflicting one.
    const isPolite = (remoteId: string) => myId < remoteId;

    // Someone sends us an offer
    const handleVoiceOffer = async (data: { fromId: string; offer: RTCSessionDescriptionInit }) => {
      if (!localStreamRef.current) return;

      let peer = peersRef.current.get(data.fromId);
      if (!peer) {
        peer = createPeerConnection(data.fromId);
      }

      const offerCollision =
        makingOfferRef.current.has(data.fromId) ||
        peer.pc.signalingState !== 'stable';

      // If we are the impolite peer and there's a collision, ignore the incoming offer
      if (offerCollision && !isPolite(data.fromId)) {
        return;
      }

      try {
        // If there's a collision and we are the polite peer, rollback first
        if (offerCollision && peer.pc.signalingState !== 'stable') {
          await peer.pc.setLocalDescription({ type: 'rollback' });
        }
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        peer.remoteDescriptionSet = true;

        // Flush any queued ICE candidates now that remote description is set
        await flushIceCandidates(peer);

        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);

        // @ts-expect-error - custom signaling event
        socket.emit('webrtc-answer', {
          targetId: data.fromId,
          answer: peer.pc.localDescription,
        });
      } catch (err) {
        console.warn('Error handling voice offer:', err);
      }
    };

    const handleVoiceAnswer = async (data: { fromId: string; answer: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current.get(data.fromId);
      if (!peer) return;

      // Only set the remote answer if we're actually expecting one
      if (peer.pc.signalingState !== 'have-local-offer') {
        return;
      }

      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        peer.remoteDescriptionSet = true;

        // Flush any queued ICE candidates
        await flushIceCandidates(peer);
      } catch (err) {
        console.warn('Error setting remote answer:', err);
      }
    };

    const handleIceCandidate = async (data: { fromId: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(data.fromId);
      if (!peer) return;

      // Queue ICE candidates if remote description isn't set yet
      if (!peer.remoteDescriptionSet) {
        peer.iceCandidateQueue.push(data.candidate);
        return;
      }

      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.warn('Error adding ICE candidate:', err);
      }
    };

    // A new peer joined voice — initiate connection
    const handleVoicePeerJoined = async (data: { peerId: string }) => {
      if (!localStreamRef.current) return;
      if (data.peerId === myId) return;

      const peer = createPeerConnection(data.peerId);
      await initiateOffer(data.peerId, peer);
    };

    // A peer left voice
    const handleVoicePeerLeft = (data: { peerId: string }) => {
      const peer = peersRef.current.get(data.peerId);
      if (peer) {
        peer.pc.close();
        peersRef.current.delete(data.peerId);
        analysersRef.current.delete(data.peerId);
        setVoicePeers(prev => prev.filter(p => p.id !== data.peerId));
      }
    };

    // Listen for existing voice peers when we join — process sequentially to avoid SDP races
    const handleVoicePeersList = async (data: { peerIds: string[] }) => {
      for (const peerId of data.peerIds) {
        if (peerId === myId) continue;
        if (!localStreamRef.current) break;

        const peer = createPeerConnection(peerId);
        await initiateOffer(peerId, peer);
      }
    };

    // @ts-expect-error - custom signaling events
    socket.on('webrtc-offer', handleVoiceOffer);
    // @ts-expect-error - custom signaling events
    socket.on('webrtc-answer', handleVoiceAnswer);
    // @ts-expect-error - custom signaling events
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    // @ts-expect-error - custom signaling events
    socket.on('voice-peer-joined', handleVoicePeerJoined);
    // @ts-expect-error - custom signaling events
    socket.on('voice-peer-left', handleVoicePeerLeft);
    // @ts-expect-error - custom signaling events
    socket.on('voice-peers-list', handleVoicePeersList);

    return () => {
      // @ts-expect-error - custom signaling events
      socket.off('webrtc-offer', handleVoiceOffer);
      // @ts-expect-error - custom signaling events
      socket.off('webrtc-answer', handleVoiceAnswer);
      // @ts-expect-error - custom signaling events
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      // @ts-expect-error - custom signaling events
      socket.off('voice-peer-joined', handleVoicePeerJoined);
      // @ts-expect-error - custom signaling events
      socket.off('voice-peer-left', handleVoicePeerLeft);
      // @ts-expect-error - custom signaling events
      socket.off('voice-peers-list', handleVoicePeersList);
    };
  }, [socket, myId, createPeerConnection, flushIceCandidates, initiateOffer]);

  // Detect who's speaking (audio level analysis)
  useEffect(() => {
    if (!isVoiceEnabled) return;

    speakingIntervalRef.current = setInterval(() => {
      setVoicePeers(prev =>
        prev.map(peer => {
          const analyser = analysersRef.current.get(peer.id);
          if (!analyser) return peer;

          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;

          return { ...peer, isSpeaking: avg > 15 };
        })
      );
    }, 150);

    return () => {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
      }
    };
  }, [isVoiceEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return {
    isVoiceEnabled,
    isMuted,
    voicePeers,
    micError,
    enableVoice,
    disableVoice,
    toggleMute,
    cleanupAll,
  };
}
