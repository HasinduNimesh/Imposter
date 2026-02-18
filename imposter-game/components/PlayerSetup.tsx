import { Player } from '@/lib/types';
import { useState } from 'react';
import { getPlayerColor, getPlayerAvatar, DetectiveNarrator } from './CartoonElements';

interface PlayerSetupProps {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: string) => void;
  onStartGame: () => void;
}

export default function PlayerSetup({
  players,
  onAddPlayer,
  onRemovePlayer,
  onStartGame
}: PlayerSetupProps) {
  const [playerName, setPlayerName] = useState('');

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      onAddPlayer(playerName.trim());
      setPlayerName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  };

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header with narrator */}
      <div className="flex items-center gap-4 mb-6">
        <DetectiveNarrator mood={players.length >= 3 ? 'happy' : 'thinking'} size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">Gather Your Squad!</h2>
          <p className="text-gray-500 text-sm mt-1">
            {players.length < 3 
              ? 'You need at least 3 players to start'
              : `${players.length} players ready to go!`
            }
          </p>
        </div>
      </div>

      {/* Add player input */}
      <div className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter player name..."
            className="cartoon-input flex-1"
            maxLength={20}
          />
          <button
            onClick={handleAddPlayer}
            disabled={!playerName.trim()}
            className="btn-cartoon btn-cartoon-primary px-5 py-3 text-base"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Player list */}
      <div className="mb-6">
        <h3 className="section-title text-lg mb-3 flex items-center gap-2">
          <span>👥</span>
          <span>Players ({players.length})</span>
        </h3>
        
        {players.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3 animate-float">🎮</div>
            <p className="text-gray-400 font-medium">
              No players yet. Add your friends!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="cartoon-card flex items-center justify-between p-3 animate-fade-in-scale"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="player-avatar text-xl"
                    style={{ background: getPlayerColor(index) }}
                  >
                    {getPlayerAvatar(index)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800 text-lg">
                      {player.name}
                    </span>
                    <p className="text-xs text-gray-400">Player {index + 1}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemovePlayer(player.id)}
                  className="btn-cartoon btn-cartoon-danger px-4 py-2 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start game button */}
      {players.length >= 3 && (
        <button
          onClick={onStartGame}
          className="btn-cartoon btn-cartoon-success w-full py-4 text-xl animate-bounce-in"
        >
          🎮 New Game
        </button>
      )}

      {players.length > 0 && players.length < 3 && (
        <div className="text-center">
          <p className="text-amber-400 font-semibold text-sm bg-amber-50 rounded-xl py-3 px-4 border-2 border-amber-200">
            ⚠️ Add at least {3 - players.length} more player{3 - players.length > 1 ? 's' : ''} to start!
          </p>
        </div>
      )}
    </div>
  );
}
