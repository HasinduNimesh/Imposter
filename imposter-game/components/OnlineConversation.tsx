'use client';

import { LobbyState } from '@/lib/onlineTypes';
import { DetectiveNarrator } from './CartoonElements';

interface OnlineConversationProps {
  lobby: LobbyState;
  myId: string;
  onStartVoting: () => void;
}

export default function OnlineConversation({
  lobby,
  myId,
  onStartVoting,
}: OnlineConversationProps) {
  const isHost = lobby.hostId === myId;

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DetectiveNarrator mood="thinking" size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">Discussion Time!</h2>
          <p className="text-gray-500 text-sm mt-1">
            Round {lobby.conversationRound} of {lobby.totalRounds}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-blue-700 mb-2 text-lg">🗣️ Talk It Out!</h3>
        <p className="text-blue-600 text-sm leading-relaxed">
          Everyone takes turns describing the word without saying it directly.
          The imposter will try to blend in — pay attention to who seems unsure!
        </p>
        <p className="text-blue-400 text-xs mt-2">
          💡 Tip: Ask follow-up questions to catch suspicious answers.
        </p>
      </div>

      {/* Player Overview */}
      <div className="mb-6">
        <h3 className="section-title text-sm mb-3">Players in this round:</h3>
        <div className="flex flex-wrap gap-2">
          {lobby.players.map((p) => (
            <span
              key={p.id}
              className={`px-3 py-2 rounded-xl text-sm font-bold border-2 ${
                p.id === myId
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              {p.name} {p.id === myId && '(You)'}
            </span>
          ))}
        </div>
      </div>

      {/* Voting prompt */}
      {isHost ? (
        <div className="space-y-3">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-center">
            <p className="text-amber-600 text-sm font-medium">
              👑 As the host, press the button below when everyone has finished discussing.
            </p>
          </div>
          <button
            onClick={onStartVoting}
            className="btn-cartoon btn-cartoon-primary w-full py-4 text-xl"
          >
            🗳️ Start Voting
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-sm font-medium">
            ⏳ The host will start voting when discussion is done.
          </p>
        </div>
      )}
    </div>
  );
}
