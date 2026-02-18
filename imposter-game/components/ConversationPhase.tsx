import { Player } from '@/lib/types';
import { getPlayerColor, getPlayerAvatar, DetectiveNarrator } from './CartoonElements';

interface ConversationPhaseProps {
  players: Player[];
  currentSpeakerIndex: number;
  conversationRound: number;
  totalRounds: number;
  onStartVoting: () => void;
}

export default function ConversationPhase({
  players,
  currentSpeakerIndex,
  conversationRound,
  totalRounds,
  onStartVoting
}: ConversationPhaseProps) {
  const currentSpeaker = players[currentSpeakerIndex];

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Round indicator */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title text-xl">💬 Conversation Time!</h2>
        <div className="bg-amber-100 border-2 border-amber-400 rounded-full px-4 py-1 text-amber-800 font-bold text-sm">
          Round {conversationRound}/{totalRounds}
        </div>
      </div>

      {/* First speaker highlight */}
      <div className="wood-surface p-5 mb-5">
        <div className="flex items-center justify-center mb-3">
          <DetectiveNarrator mood="happy" size={50} />
        </div>
        <p className="text-center text-amber-200 text-sm font-medium mb-3">
          🎲 Randomly Selected First Speaker:
        </p>
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-center gap-3">
          <div 
            className="player-avatar text-xl w-12 h-12"
            style={{ background: getPlayerColor(currentSpeakerIndex) }}
          >
            {getPlayerAvatar(currentSpeakerIndex)}
          </div>
          <div>
            <p className="text-3xl font-bold text-white drop-shadow">
              {currentSpeaker.name}
            </p>
            <p className="text-amber-200 text-sm">Start the conversation!</p>
          </div>
        </div>
      </div>

      {/* Instructions as speech bubble */}
      <div className="speech-bubble mb-5">
        <h4 className="font-bold text-gray-800 mb-3 text-lg">📋 Rules:</h4>
        <div className="space-y-2">
          {[
            { icon: '🗣️', text: 'Take turns talking about the word (don\'t say it!)' },
            { icon: '👂', text: 'Listen carefully to spot the imposter' },
            { icon: '🎭', text: 'Imposters: Blend in with what others say!' },
            { icon: '🔍', text: 'Be specific enough to prove you know the word' },
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2 text-gray-700">
              <span className="text-lg flex-shrink-0">{rule.icon}</span>
              <span className="text-sm">{rule.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Player grid */}
      <div className="mb-5">
        <h4 className="section-title text-base mb-3">👥 Players</h4>
        <div className="grid grid-cols-2 gap-2">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`player-item-card flex items-center gap-2 p-3 ${
                index === currentSpeakerIndex ? 'selected' : ''
              }`}
            >
              <div 
                className="player-avatar text-sm w-8 h-8"
                style={{ background: getPlayerColor(index) }}
              >
                {getPlayerAvatar(index)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{player.name}</p>
                {index === currentSpeakerIndex && (
                  <p className="text-xs text-amber-600 font-medium">🎤 Starting</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStartVoting}
        className="btn-cartoon btn-cartoon-primary w-full py-4 text-lg"
      >
        🗳️ Finish & Start Voting
      </button>
    </div>
  );
}
