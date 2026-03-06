'use client';

import { useState } from 'react';
import { DetectiveNarrator } from './CartoonElements';

interface ImposterGuessModalProps {
  onSubmitGuess: (guess: string) => void;
}

export default function ImposterGuessModal({ onSubmitGuess }: ImposterGuessModalProps) {
  const [guess, setGuess] = useState('');

  const handleSubmit = () => {
    onSubmitGuess(guess.trim());
  };

  const handleSkip = () => {
    onSubmitGuess('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="dialog-panel p-6 md:p-8 animate-slide-up max-w-md w-full">
        <div className="flex items-center gap-4 mb-6">
          <DetectiveNarrator mood="shocked" size={60} />
          <div>
            <h2 className="section-title text-2xl md:text-3xl">You Were Caught!</h2>
            <p className="text-gray-500 text-sm mt-1">
              But you have one last chance...
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-5 text-center">
          <p className="text-amber-700 font-bold text-lg mb-1">🎯 Guess the Secret Word!</p>
          <p className="text-amber-600 text-sm">
            If you guess correctly, you earn <span className="font-bold">+20 bonus points</span>!
          </p>
        </div>

        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && guess.trim() && handleSubmit()}
          placeholder="Type your guess..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-medium focus:border-purple-400 focus:outline-none mb-4"
          autoFocus
        />

        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={!guess.trim()}
            className="btn-cartoon btn-cartoon-success w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎯 Submit Guess
          </button>
          <button
            onClick={handleSkip}
            className="btn-cartoon w-full py-2 text-gray-500 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-300 text-sm"
          >
            Skip (no guess)
          </button>
        </div>
      </div>
    </div>
  );
}
