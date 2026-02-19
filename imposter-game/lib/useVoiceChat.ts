'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameSocket } from '@/lib/socketClient';

interface PeerConnection {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
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
  ],
};

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
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const remoteStream = new MediaStream();

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });

        // Set up analyser for this peer
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        try {
          const source = audioContextRef.current.createMediaStreamSource(remoteStream);
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          analysersRef.current.set(remoteId, analyser);
        } catch {
          // Ignore analyser errors
        }

        // Update peers list
        const player = players.find(p => p.id === remoteId);
        setVoicePeers(prev => {
          const exists = prev.find(p => p.id === remoteId);
          if (exists) return prev;
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
        if (event.candidate && socket) {
          // @ts-expect-error - custom signaling event
          socket.emit('webrtc-ice-candidate', {
            targetId: remoteId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          // Remove peer
          peersRef.current.delete(remoteId);
          analysersRef.current.delete(remoteId);
          setVoicePeers(prev => prev.filter(p => p.id !== remoteId));
        }
      };

      const peerConn: PeerConnection = { pc, remoteStream };
      peersRef.current.set(remoteId, peerConn);
      return peerConn;
    },
    [socket, players]
  );

  // Enable voice chat
  const enableVoice = useCallback(async () => {
    try {
      setMicError(null);
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
      setMicError('Could not access microphone. Please allow mic permission and try again.');
    }
  }, [socket, lobbyCode]);

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

    // Someone wants to connect voice with us
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
        if (offerCollision) {
          await peer.pc.setLocalDescription({ type: 'rollback' });
        }
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);

        // @ts-expect-error - custom signaling event
        socket.emit('webrtc-answer', {
          targetId: data.fromId,
          answer: answer,
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
      } catch (err) {
        console.warn('Error setting remote answer:', err);
      }
    };

    const handleIceCandidate = async (data: { fromId: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(data.fromId);
      if (peer) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
          // Ignore ICE candidate errors — may arrive before remote description
        }
      }
    };

    // A new peer joined voice — initiate connection
    const handleVoicePeerJoined = async (data: { peerId: string }) => {
      if (!localStreamRef.current) return;
      if (data.peerId === myId) return;

      const peer = createPeerConnection(data.peerId);
      try {
        makingOfferRef.current.add(data.peerId);
        const offer = await peer.pc.createOffer();
        await peer.pc.setLocalDescription(offer);

        // @ts-expect-error - custom signaling event
        socket.emit('webrtc-offer', {
          targetId: data.peerId,
          offer: offer,
        });
      } catch (err) {
        console.warn('Error creating offer for peer:', err);
      } finally {
        makingOfferRef.current.delete(data.peerId);
      }
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

    // Listen for existing voice peers when we join
    const handleVoicePeersList = (data: { peerIds: string[] }) => {
      // We'll initiate offers to each existing peer
      data.peerIds.forEach(async (peerId) => {
        if (peerId === myId) return;
        if (!localStreamRef.current) return;

        const peer = createPeerConnection(peerId);
        try {
          makingOfferRef.current.add(peerId);
          const offer = await peer.pc.createOffer();
          await peer.pc.setLocalDescription(offer);

          // @ts-expect-error - custom signaling event
          socket.emit('webrtc-offer', {
            targetId: peerId,
            offer: offer,
          });
        } catch (err) {
          console.warn('Error creating offer for existing peer:', err);
        } finally {
          makingOfferRef.current.delete(peerId);
        }
      });
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
  }, [socket, myId, createPeerConnection]);

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
