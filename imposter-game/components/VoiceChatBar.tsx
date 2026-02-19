'use client';

import { useEffect, useRef } from 'react';
import { getPlayerColor, getPlayerAvatar } from './CartoonElements';

interface VoicePeer {
  id: string;
  name: string;
  stream: MediaStream;
  isSpeaking: boolean;
}

interface VoiceChatBarProps {
  isVoiceEnabled: boolean;
  isMuted: boolean;
  voicePeers: VoicePeer[];
  micError: string | null;
  onEnableVoice: () => void;
  onDisableVoice: () => void;
  onToggleMute: () => void;
  players: { id: string; name: string }[];
  myId: string;
  myName: string;
}

// Hidden audio elements to play remote streams
function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

export default function VoiceChatBar({
  isVoiceEnabled,
  isMuted,
  voicePeers,
  micError,
  onEnableVoice,
  onDisableVoice,
  onToggleMute,
  players,
  myId,
  myName,
}: VoiceChatBarProps) {

  if (!isVoiceEnabled) {
    return (
      <div className="mb-4 animate-fade-in">
        <button
          onClick={onEnableVoice}
          className="w-full cartoon-card p-3 flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform cursor-pointer group"
        >
          <span className="text-2xl">🎙️</span>
          <div className="text-left">
            <p className="font-bold text-gray-700 text-sm group-hover:text-purple-600 transition-colors">
              Enable Voice Chat
            </p>
            <p className="text-xs text-gray-400">Talk with other players in real time</p>
          </div>
        </button>
        {micError && (
          <div className="mt-2 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl p-2 text-xs font-medium">
            ⚠️ {micError}
          </div>
        )}
      </div>
    );
  }

  const myPlayerIndex = players.findIndex(p => p.id === myId);

  return (
    <div className="mb-4 animate-fade-in">
      {/* Hidden audio elements for remote streams */}
      {voicePeers.map(peer => (
        <RemoteAudio key={peer.id} stream={peer.stream} />
      ))}

      {/* Voice chat panel */}
      <div className="cartoon-card p-3 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎙️</span>
            <span className="font-bold text-gray-700 text-sm">Voice Chat</span>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">
              LIVE
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleMute}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${
                isMuted
                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                  : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
              }`}
            >
              {isMuted ? '🔇 Muted' : '🔊 Speaking'}
            </button>
            <button
              onClick={onDisableVoice}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 border-2 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-red-500 hover:border-red-200 transition-all"
              title="Leave voice chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Participants */}
        <div className="flex flex-wrap gap-2">
          {/* Self */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isMuted
                ? 'bg-gray-100 text-gray-500'
                : 'bg-green-50 text-green-700 ring-2 ring-green-300 animate-pulse-soft'
            }`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{ background: getPlayerColor(myPlayerIndex >= 0 ? myPlayerIndex : 0) }}
            >
              {getPlayerAvatar(myPlayerIndex >= 0 ? myPlayerIndex : 0)}
            </div>
            <span>{myName}</span>
            {isMuted ? (
              <span className="text-red-400">🔇</span>
            ) : (
              <span className="text-green-500">🔊</span>
            )}
          </div>

          {/* Remote peers */}
          {voicePeers.map(peer => {
            const peerIndex = players.findIndex(p => p.id === peer.id);
            return (
              <div
                key={peer.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  peer.isSpeaking
                    ? 'bg-green-50 text-green-700 ring-2 ring-green-300'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: getPlayerColor(peerIndex >= 0 ? peerIndex : 0) }}
                >
                  {getPlayerAvatar(peerIndex >= 0 ? peerIndex : 0)}
                </div>
                <span>{peer.name}</span>
                {peer.isSpeaking ? (
                  <span className="text-green-500">🔊</span>
                ) : (
                  <span className="text-gray-400">🔇</span>
                )}
              </div>
            );
          })}

          {voicePeers.length === 0 && (
            <span className="text-xs text-gray-400 py-1">
              Waiting for others to join voice...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
