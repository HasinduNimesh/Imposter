'use client';

import { LobbyState } from '@/lib/onlineTypes';
import { getPlayerColor, getPlayerAvatar, DetectiveNarrator } from './CartoonElements';

interface OnlineVotingProps {
  lobby: LobbyState;
  myId: string;
  hasVoted: boolean;
  votedCount: number;
  onVote: (votedForId: string) => void;
}

export default function OnlineVoting({
  lobby,
  myId,
  hasVoted,
  votedCount,
  onVote,
}: OnlineVotingProps) {
  const myPlayer = lobby.players.find((p) => p.id === myId);

  if (hasVoted) {
    return (
      <div className="dialog-panel p-6 md:p-8 animate-slide-up">
        <div className="flex items-center gap-4 mb-6">
          <DetectiveNarrator mood="thinking" size={60} />
          <div>
            <h2 className="section-title text-2xl md:text-3xl">Vote Submitted!</h2>
            <p className="text-gray-500 text-sm mt-1">Waiting for others to vote...</p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="text-5xl mb-4 animate-float">🗳️</div>
          <p className="text-gray-500 font-medium text-lg mb-4">
            {votedCount}/{lobby.players.filter(p => !p.isDisconnected).length} players have voted
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden max-w-xs mx-auto">
            <div
              className="bg-linear-to-r from-purple-400 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${(votedCount / lobby.players.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DetectiveNarrator mood="thinking" size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">Time to Vote!</h2>
          <p className="text-gray-500 text-sm mt-1">
            {myPlayer?.name}, who do you think is the imposter?
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 mb-5 text-center">
        <p className="text-amber-600 text-sm font-medium">
          ⚠️ You cannot vote for yourself. Choose wisely!
        </p>
      </div>

      {/* Vote Options */}
      <div className="space-y-3">
        {lobby.players
          .filter((p) => p.id !== myId && !p.isDisconnected)
          .map((player) => {
            const index = lobby.players.findIndex((p) => p.id === player.id);
            return (
              <button
                key={player.id}
                onClick={() => onVote(player.id)}
                className="w-full cartoon-card flex items-center gap-4 p-4 hover:scale-[1.02] transition-transform cursor-pointer group"
              >
                <div
                  className="player-avatar text-xl"
                  style={{ background: getPlayerColor(index) }}
                >
                  {getPlayerAvatar(index)}
                </div>
                <span className="font-bold text-gray-800 text-lg group-hover:text-red-600 transition-colors flex-1 text-left">
                  {player.name}
                </span>
                <span className="text-red-400 text-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  🗳️
                </span>
              </button>
            );
          })}

        {/* Disconnected players shown as disabled */}
        {lobby.players
          .filter((p) => p.id !== myId && p.isDisconnected)
          .map((player) => {
            const index = lobby.players.findIndex((p) => p.id === player.id);
            return (
              <div
                key={player.id}
                className="w-full cartoon-card flex items-center gap-4 p-4 opacity-40 cursor-not-allowed"
              >
                <div
                  className="player-avatar text-xl grayscale"
                  style={{ background: getPlayerColor(index) }}
                >
                  {getPlayerAvatar(index)}
                </div>
                <span className="font-bold text-gray-400 text-lg flex-1 text-left">
                  {player.name}
                </span>
                <span className="text-gray-400 text-xs">⏳ Disconnected</span>
              </div>
            );
          })}
      </div>

      <p className="text-center text-gray-400 text-xs mt-4">
        {votedCount}/{lobby.players.filter(p => !p.isDisconnected).length} votes cast
      </p>
    </div>
  );
}
