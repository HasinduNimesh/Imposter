import { Player, GameSettings } from '@/lib/types';
import { categories } from '@/lib/wordDatabase';
import { useState } from 'react';
import { DetectiveNarrator } from './CartoonElements';

interface GameSettingsPageProps {
  players: Player[];
  onStartGame: (settings: GameSettings) => void;
  onBack: () => void;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  'Foods and Drinks': '🍕',
  'Brands': '🏷️',
  'Daily Use Objects': '🔑',
  'Sports': '⚽',
  'Entertainment': '🎬',
  'Animals': '🦁',
  'Countries': '🌍',
  'Vehicles': '🚗',
  'Programming Languages': '💻'
};

export default function GameSettingsPage({
  players,
  onStartGame,
  onBack
}: GameSettingsPageProps) {
  const [numberOfImposters, setNumberOfImposters] = useState(1);
  const [category, setCategory] = useState(categories[0]);
  const [numberOfConversations, setNumberOfConversations] = useState(2);
  const [useHintForImposter, setUseHintForImposter] = useState(true);

  const maxImposters = Math.max(1, players.length - 1);

  const handleStartGame = () => {
    const settings: GameSettings = {
      numberOfImposters,
      category,
      numberOfConversations,
      useHintForImposter
    };
    onStartGame(settings);
  };

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DetectiveNarrator mood="thinking" size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">Game Setup</h2>
          <p className="text-gray-500 text-sm mt-1">Customize your game rules</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Number of Imposters */}
        <div className="cartoon-card p-4">
          <label className="section-title text-base flex items-center gap-2 mb-2">
            <span className="text-xl">🎭</span> Number of Imposters
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {players.length} players in game
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNumberOfImposters(Math.max(1, numberOfImposters - 1))}
              className="btn-cartoon btn-cartoon-danger w-10 h-10 text-lg flex items-center justify-center rounded-full"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-4xl font-bold text-purple-600">{numberOfImposters}</span>
            </div>
            <button
              onClick={() => setNumberOfImposters(Math.min(maxImposters, numberOfImposters + 1))}
              className="btn-cartoon btn-cartoon-success w-10 h-10 text-lg flex items-center justify-center rounded-full"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">
            Max: {maxImposters}
          </p>
        </div>

        {/* Category Selection */}
        <div className="cartoon-card p-4">
          <label className="section-title text-base flex items-center gap-2 mb-3">
            <span className="text-xl">📂</span> Word Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`p-3 rounded-xl text-center transition-all border-2 ${
                  category === cat
                    ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                }`}
              >
                <div className="text-2xl mb-1">{CATEGORY_ICONS[cat] || '📦'}</div>
                <div className="text-xs font-semibold text-gray-700 leading-tight">{cat}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Number of Conversations */}
        <div className="cartoon-card p-4">
          <label className="section-title text-base flex items-center gap-2 mb-2">
            <span className="text-xl">💬</span> Conversation Rounds
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNumberOfConversations(Math.max(1, numberOfConversations - 1))}
              className="btn-cartoon btn-cartoon-danger w-10 h-10 text-lg flex items-center justify-center rounded-full"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-4xl font-bold text-purple-600">{numberOfConversations}</span>
            </div>
            <button
              onClick={() => setNumberOfConversations(Math.min(10, numberOfConversations + 1))}
              className="btn-cartoon btn-cartoon-success w-10 h-10 text-lg flex items-center justify-center rounded-full"
            >
              +
            </button>
          </div>
        </div>

        {/* Hint Toggle */}
        <div className="cartoon-card p-4 flex items-center justify-between">
          <div>
            <label className="section-title text-base flex items-center gap-2">
              <span className="text-xl">💡</span> Imposter Hint
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Give imposters a clue about the secret word
            </p>
          </div>
          <button
            onClick={() => setUseHintForImposter(!useHintForImposter)}
            className={`cartoon-toggle ${useHintForImposter ? 'active' : ''}`}
          >
            <div className="cartoon-toggle-knob" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="btn-cartoon btn-cartoon-warning flex-1 py-4 text-lg"
        >
          ← Back
        </button>
        <button
          onClick={handleStartGame}
          className="btn-cartoon btn-cartoon-success flex-[2] py-4 text-lg"
        >
          🎮 Start Game!
        </button>
      </div>
    </div>
  );
}
