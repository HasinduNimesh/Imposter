'use client';

import { LobbyState, LobbySettings, Difficulty } from '@/lib/onlineTypes';
import { useState } from 'react';
import { DetectiveNarrator } from './CartoonElements';

interface OnlineSettingsProps {
  lobby: LobbyState;
  myId: string;
  onStartGame: (settings: LobbySettings) => void;
}

const presetCategories = [
  'Foods and Drinks',
  'Brands',
  'Daily Use Objects',
  'Sports',
  'Movies and TV Shows',
  'Countries',
];

const difficulties: { value: Difficulty; label: string; emoji: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', emoji: '🟢', desc: 'Common words, obvious hints' },
  { value: 'medium', label: 'Medium', emoji: '🟡', desc: 'Moderate words, vague hints' },
  { value: 'hard', label: 'Hard', emoji: '🔴', desc: 'Obscure words, cryptic hints' },
];

export default function OnlineSettings({ lobby, myId, onStartGame }: OnlineSettingsProps) {
  const isHost = lobby.hostId === myId;
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [settings, setSettings] = useState<LobbySettings>({
    numberOfImposters: 1,
    category: presetCategories[0],
    customCategory: '',
    difficulty: 'medium',
    numberOfConversations: 2,
    useHintForImposter: false,
  });

  const maxImposters = Math.max(1, Math.floor(lobby.players.length / 3));

  const handleStart = () => {
    onStartGame({
      ...settings,
      customCategory: useCustomCategory ? customCategoryInput.trim() : '',
    });
  };

  if (!isHost) {
    return (
      <div className="dialog-panel p-6 md:p-8 animate-slide-up">
        <div className="flex items-center gap-4 mb-6">
          <DetectiveNarrator mood="thinking" size={60} />
          <div>
            <h2 className="section-title text-2xl md:text-3xl">Game Settings</h2>
            <p className="text-gray-500 text-sm mt-1">
              The host is configuring the game...
            </p>
          </div>
        </div>
        <div className="text-center py-10">
          <div className="text-5xl mb-4 animate-float">⏳</div>
          <p className="text-gray-400 font-medium text-lg">
            Waiting for host to start the game...
          </p>
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
          <h2 className="section-title text-2xl md:text-3xl">Game Settings</h2>
          <p className="text-gray-500 text-sm mt-1">
            Configure the game for {lobby.players.length} players
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="section-title text-sm mb-3 block">📂 Category</label>

        {/* Toggle: Preset vs Custom */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setUseCustomCategory(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
              !useCustomCategory
                ? 'bg-purple-500 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
            }`}
          >
            📋 Preset
          </button>
          <button
            onClick={() => setUseCustomCategory(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
              useCustomCategory
                ? 'bg-purple-500 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
            }`}
          >
            ✨ Custom (AI)
          </button>
        </div>

        {useCustomCategory ? (
          <div>
            <input
              type="text"
              value={customCategoryInput}
              onChange={(e) => setCustomCategoryInput(e.target.value)}
              placeholder="e.g. Sri Lankan street food, 90s cartoons..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-purple-400 focus:outline-none"
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              🤖 AI will generate words for any topic you type
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {presetCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSettings((s) => ({ ...s, category: cat }))}
                className={`p-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  settings.category === cat
                    ? 'bg-purple-500 text-white border-purple-600 shadow-lg scale-105'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div className="mb-5">
        <label className="section-title text-sm mb-3 block">🎯 Difficulty</label>
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button
              key={d.value}
              onClick={() => setSettings((s) => ({ ...s, difficulty: d.value }))}
              className={`flex-1 py-3 px-2 rounded-xl border-2 transition-all text-center ${
                settings.difficulty === d.value
                  ? d.value === 'easy'
                    ? 'bg-green-500 text-white border-green-600 shadow-lg'
                    : d.value === 'medium'
                    ? 'bg-yellow-500 text-white border-yellow-600 shadow-lg'
                    : 'bg-red-500 text-white border-red-600 shadow-lg'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg">{d.emoji}</div>
              <div className="text-xs font-bold mt-0.5">{d.label}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5 ml-1">
          {difficulties.find((d) => d.value === settings.difficulty)?.desc}
        </p>
      </div>

      {/* Number of Imposters */}
      <div className="mb-5">
        <label className="section-title text-sm mb-3 block">
          🕵️ Number of Imposters
        </label>
        <div className="flex gap-2">
          {Array.from({ length: maxImposters }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setSettings((s) => ({ ...s, numberOfImposters: n }))}
              className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                settings.numberOfImposters === n
                  ? 'bg-red-500 text-white border-red-600 shadow-lg'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Rounds */}
      <div className="mb-5">
        <label className="section-title text-sm mb-3 block">
          💬 Conversation Rounds
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setSettings((s) => ({ ...s, numberOfConversations: n }))}
              className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                settings.numberOfConversations === n
                  ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Hint for Imposter */}
      <div className="mb-6">
        <button
          onClick={() =>
            setSettings((s) => ({ ...s, useHintForImposter: !s.useHintForImposter }))
          }
          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
            settings.useHintForImposter
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-gray-200'
          }`}
        >
          <span className="text-2xl">{settings.useHintForImposter ? '💡' : '🔒'}</span>
          <div>
            <p className="font-bold text-gray-800 text-sm">Hint for Imposter</p>
            <p className="text-xs text-gray-500">
              {settings.useHintForImposter
                ? 'Imposters will see a hint about the word'
                : 'Imposters get no help — hard mode!'}
            </p>
          </div>
        </button>
      </div>

      {/* Start */}
      <button
        onClick={handleStart}
        disabled={useCustomCategory && !customCategoryInput.trim()}
        className="btn-cartoon btn-cartoon-success w-full py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        🚀 Start Game!
      </button>
    </div>
  );
}
