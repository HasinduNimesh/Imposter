import { Player } from '@/lib/types';
import { useState } from 'react';
import { getPlayerColor, getPlayerAvatar, ImposterCharacter, DetectiveNarrator } from './CartoonElements';

interface WordRevealProps {
  players: Player[];
  currentPlayerIndex: number;
  word: string;
  hint: string;
  useHint: boolean;
  onNext: () => void;
}

export default function WordReveal({
  players,
  currentPlayerIndex,
  word,
  hint,
  useHint,
  onNext
}: WordRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const currentPlayer = players[currentPlayerIndex];
  const isLastPlayer = currentPlayerIndex === players.length - 1;

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleNext = () => {
    setIsRevealed(false);
    onNext();
  };

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-500">
          Player {currentPlayerIndex + 1} / {players.length}
        </span>
        <div className="flex gap-2">
          {players.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${
                index === currentPlayerIndex ? 'active' :
                index < currentPlayerIndex ? 'done' : 'pending'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current player card */}
      <div className="wood-surface p-6 mb-5">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div 
            className="player-avatar text-2xl w-14 h-14"
            style={{ background: getPlayerColor(currentPlayerIndex) }}
          >
            {getPlayerAvatar(currentPlayerIndex)}
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white drop-shadow-md">
              {currentPlayer.name}
            </h3>
            <p className="text-amber-200 text-sm">
              {isRevealed ? "Remember & pass the phone!" : "Tap to see your role"}
            </p>
          </div>
        </div>

        {!isRevealed ? (
          <button
            onClick={handleReveal}
            className="btn-cartoon btn-cartoon-cyan w-full py-5 text-xl animate-pulse-glow"
          >
            👁️ TAP TO REVEAL 👁️
          </button>
        ) : (
          <div className="animate-fade-in-scale">
            {currentPlayer.isImposter ? (
              <div className="bg-gradient-to-br from-red-500 via-red-600 to-purple-700 rounded-2xl p-6 text-center text-white border-2 border-red-400 relative overflow-hidden">
                {/* Diagonal stripes decoration */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                }} />
                
                <div className="relative z-10">
                  <ImposterCharacter size={80} />
                  <h4 className="text-3xl font-bold mt-2 mb-2 animate-wiggle">
                    YOU ARE THE IMPOSTER!
                  </h4>
                  
                  {useHint && (
                    <div className="bg-black/30 rounded-xl p-4 mt-3 mb-2 backdrop-blur-sm">
                      <p className="text-amber-300 text-sm mb-1 font-medium">💡 Your Hint:</p>
                      <p className="text-3xl font-bold text-yellow-300">{hint}</p>
                    </div>
                  )}
                  
                  <p className="text-red-200 text-sm mt-2">
                    Blend in! Don't get caught! 🤫
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl p-6 text-center text-white border-2 border-emerald-300 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)'
                }} />
                
                <div className="relative z-10">
                  <DetectiveNarrator mood="happy" size={60} />
                  <h4 className="text-lg font-bold mt-2 mb-2 text-emerald-100">
                    Your Secret Word:
                  </h4>
                  <p className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg animate-bounce-in">
                    {word}
                  </p>
                  <p className="text-emerald-100 text-sm">
                    Describe it without saying it! 🔍
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleNext}
              className="btn-cartoon btn-cartoon-warning w-full py-4 text-lg mt-4"
            >
              {isLastPlayer ? '💬 Start Conversation' : '➡️ Next Player'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
