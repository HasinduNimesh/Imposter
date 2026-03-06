'use client';

import { LobbyState } from '@/lib/onlineTypes';
import { getPlayerColor, getPlayerAvatar, DetectiveNarrator } from './CartoonElements';
import { useState } from 'react';

interface OnlineWaitingRoomProps {
  lobby: LobbyState;
  myId: string;
  onStartSettings: () => void;
  onLeaveLobby: () => void;
  onKickPlayer: (playerId: string) => void;
}

export default function OnlineWaitingRoom({
  lobby,
  myId,
  onStartSettings,
  onLeaveLobby,
  onKickPlayer,
}: OnlineWaitingRoomProps) {
  const isHost = lobby.hostId === myId;
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(lobby.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = lobby.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DetectiveNarrator mood={lobby.players.length >= 3 ? 'happy' : 'thinking'} size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">
            {isHost ? 'Your Lobby' : 'Waiting Room'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {lobby.players.length < 3
              ? `Waiting for players... (need ${3 - lobby.players.length} more)`
              : `${lobby.players.length} players ready!`}
          </p>
        </div>
      </div>

      {/* Room Code Display */}
      <div className="bg-linear-to-r from-purple-500 to-blue-500 rounded-2xl p-5 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-4 text-6xl">🔑</div>
          <div className="absolute bottom-2 right-4 text-6xl">🎮</div>
        </div>
        <p className="text-purple-100 text-xs uppercase tracking-widest font-bold mb-2 relative">
          Room Code
        </p>
        <div className="flex items-center justify-center gap-3 relative">
          <span className="text-4xl md:text-5xl font-black text-white tracking-[0.3em] font-mono">
            {lobby.code}
          </span>
          <button
            onClick={copyCode}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all text-sm"
            title="Copy code"
          >
            {copied ? '✓' : '📋'}
          </button>
        </div>
        <p className="text-purple-100 text-xs mt-2 relative">
          Share this code with your friends to join!
        </p>
      </div>

      {/* Player List */}
      <div className="mb-6">
        <h3 className="section-title text-lg mb-3 flex items-center gap-2">
          <span>👥</span>
          <span>Players ({lobby.players.length}/12)</span>
        </h3>

        <div className="space-y-3">
          {lobby.players.map((player, index) => (
            <div
              key={player.id}
              className={`cartoon-card flex items-center justify-between p-3 animate-fade-in-scale ${
                player.id === myId ? 'ring-2 ring-purple-400' : ''
              } ${player.isDisconnected ? 'opacity-50' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`player-avatar text-xl ${player.isDisconnected ? 'grayscale' : ''}`}
                  style={{ background: getPlayerColor(index) }}
                >
                  {getPlayerAvatar(index)}
                </div>
                <div>
                  <span className={`font-semibold text-lg ${player.isDisconnected ? 'text-gray-400' : 'text-gray-800'}`}>
                    {player.name}
                    {player.id === myId && (
                      <span className="text-xs text-purple-500 ml-2">(You)</span>
                    )}
                  </span>
                  <p className="text-xs text-gray-400">
                    {player.isDisconnected
                      ? '⏳ Reconnecting...'
                      : player.isHost
                        ? '👑 Host'
                        : `Player ${index + 1}`}
                  </p>
                </div>
              </div>
              {isHost && player.id !== myId && !player.isDisconnected && (
                <button
                  onClick={() => onKickPlayer(player.id)}
                  className="btn-cartoon btn-cartoon-danger px-3 py-1 text-xs"
                >
                  Kick
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {isHost && lobby.players.length >= 3 && (
          <button
            onClick={onStartSettings}
            className="btn-cartoon btn-cartoon-success w-full py-4 text-xl animate-bounce-in"
          >
            🎮 Start Game
          </button>
        )}

        {isHost && lobby.players.length < 3 && (
          <div className="text-center">
            <p className="text-amber-400 font-semibold text-sm bg-amber-50 rounded-xl py-3 px-4 border-2 border-amber-200">
              ⚠️ Need at least {3 - lobby.players.length} more player
              {3 - lobby.players.length > 1 ? 's' : ''} to start!
            </p>
          </div>
        )}

        {!isHost && (
          <div className="text-center">
            <p className="text-blue-400 font-semibold text-sm bg-blue-50 rounded-xl py-3 px-4 border-2 border-blue-200">
              ⏳ Waiting for host to start the game...
            </p>
          </div>
        )}

        <button
          onClick={onLeaveLobby}
          className="btn-cartoon w-full py-3 text-gray-500 hover:text-red-500 border-2 border-gray-200 hover:border-red-300"
        >
          🚪 Leave Lobby
        </button>
      </div>
    </div>
  );
}
