'use client';

import { useState } from 'react';
import { DetectiveNarrator } from './CartoonElements';

interface OnlineLobbyJoinProps {
  onCreateLobby: (playerName: string) => void;
  onJoinLobby: (code: string, playerName: string) => void;
  onRejoinLobby: (code: string, playerName: string) => void;
  onBack: () => void;
  error: string | null;
  isConnecting: boolean;
}

export default function OnlineLobbyJoin({
  onCreateLobby,
  onJoinLobby,
  onRejoinLobby,
  onBack,
  error,
  isConnecting,
}: OnlineLobbyJoinProps) {
  const [tab, setTab] = useState<'create' | 'join' | 'rejoin'>('create');
  const [playerName, setPlayerName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [rejoinCode, setRejoinCode] = useState('');

  const handleCreate = () => {
    if (playerName.trim()) {
      onCreateLobby(playerName.trim());
    }
  };

  const handleJoin = () => {
    if (playerName.trim() && lobbyCode.trim()) {
      onJoinLobby(lobbyCode.trim().toUpperCase(), playerName.trim());
    }
  };

  const handleRejoin = () => {
    if (playerName.trim() && rejoinCode.trim()) {
      onRejoinLobby(rejoinCode.trim().toUpperCase(), playerName.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action();
  };

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DetectiveNarrator mood="happy" size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">Online Play</h2>
          <p className="text-gray-500 text-sm mt-1">Create or join a game lobby</p>
        </div>
      </div>

      {/* Tab Switches */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('create')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${
            tab === 'create'
              ? 'bg-purple-500 text-white border-purple-600 shadow-lg'
              : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
          }`}
        >
          🏠 Create
        </button>
        <button
          onClick={() => setTab('join')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${
            tab === 'join'
              ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
          }`}
        >
          🔗 Join
        </button>
        <button
          onClick={() => setTab('rejoin')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${
            tab === 'rejoin'
              ? 'bg-amber-500 text-white border-amber-600 shadow-lg'
              : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'
          }`}
        >
          🔄 Rejoin
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm font-medium animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {/* Name Input (shared) */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-600 mb-2 block">Your Name</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name..."
          className="cartoon-input w-full"
          maxLength={20}
        />
      </div>

      {/* Create Tab */}
      {tab === 'create' && (
        <div className="animate-fade-in">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
            <p className="text-purple-700 text-sm">
              <strong>How it works:</strong> Create a lobby and share the room code with your friends. 
              They&apos;ll enter the code to join your game!
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={!playerName.trim() || isConnecting}
            className="btn-cartoon btn-cartoon-primary w-full py-4 text-lg"
          >
            {isConnecting ? '⏳ Creating...' : '🏠 Create New Lobby'}
          </button>
        </div>
      )}

      {/* Join Tab */}
      {tab === 'join' && (
        <div className="animate-fade-in">
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Room Code</label>
            <input
              type="text"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => handleKeyPress(e, handleJoin)}
              placeholder="Enter 6-letter code..."
              className="cartoon-input w-full text-center text-2xl tracking-[0.3em] font-bold uppercase"
              maxLength={6}
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={!playerName.trim() || lobbyCode.length !== 6 || isConnecting}
            className="btn-cartoon btn-cartoon-success w-full py-4 text-lg"
          >
            {isConnecting ? '⏳ Joining...' : '🔗 Join Lobby'}
          </button>
        </div>
      )}

      {/* Rejoin Tab */}
      {tab === 'rejoin' && (
        <div className="animate-fade-in">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-amber-700 text-sm">
              <strong>Lost connection?</strong> Enter the same name and room code you used before.
              You have 60 seconds from when you disconnected to rejoin.
            </p>
          </div>
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Room Code</label>
            <input
              type="text"
              value={rejoinCode}
              onChange={(e) => setRejoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => handleKeyPress(e, handleRejoin)}
              placeholder="Enter 6-letter code..."
              className="cartoon-input w-full text-center text-2xl tracking-[0.3em] font-bold uppercase"
              maxLength={6}
            />
          </div>
          <button
            onClick={handleRejoin}
            disabled={!playerName.trim() || rejoinCode.length !== 6 || isConnecting}
            className="btn-cartoon w-full py-4 text-lg bg-amber-500 text-white border-2 border-amber-600 hover:bg-amber-600"
          >
            {isConnecting ? '⏳ Rejoining...' : '🔄 Rejoin Game'}
          </button>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="btn-cartoon w-full py-3 mt-4 text-gray-500 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-300"
      >
        ← Back to Mode Selection
      </button>
    </div>
  );
}
