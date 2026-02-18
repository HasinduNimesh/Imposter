import { Player } from '@/lib/types';
import { useState } from 'react';
import { getPlayerColor, getPlayerAvatar, DetectiveNarrator } from './CartoonElements';

interface VotingPhaseProps {
  players: Player[];
  votes: { [playerId: string]: string };
  onVote: (voterId: string, votedForId: string) => void;
  onShowResults: () => void;
}

export default function VotingPhase({
  players,
  votes,
  onVote,
  onShowResults
}: VotingPhaseProps) {
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  const currentVoter = players[currentVoterIndex];
  const allVotesCast = Object.keys(votes).length === players.length;

  const handleCastVote = () => {
    if (selectedVote) {
      onVote(currentVoter.id, selectedVote);
      setSelectedVote(null);
      if (currentVoterIndex < players.length - 1) {
        setCurrentVoterIndex(currentVoterIndex + 1);
      }
    }
  };

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title text-xl">🗳️ Voting Time!</h2>
        <div className="flex gap-2">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`progress-dot ${
                votes[player.id] !== undefined ? 'done' :
                index === currentVoterIndex ? 'active' : 'pending'
              }`}
            />
          ))}
        </div>
      </div>

      {!allVotesCast ? (
        <>
          {/* Current voter */}
          <div className="wood-surface p-5 mb-5">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div 
                className="player-avatar text-xl w-12 h-12"
                style={{ background: getPlayerColor(currentVoterIndex) }}
              >
                {getPlayerAvatar(currentVoterIndex)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white drop-shadow">
                  {currentVoter.name}
                </h3>
                <p className="text-amber-200 text-sm">
                  Voter {currentVoterIndex + 1} of {players.length}
                </p>
              </div>
            </div>
            <div className="flex justify-center mt-2">
              <DetectiveNarrator mood="thinking" size={50} />
            </div>
          </div>

          {/* Vote selection */}
          <div className="mb-5">
            <h4 className="section-title text-base mb-3">
              🕵️ Who is the Imposter?
            </h4>
            <div className="space-y-2">
              {players.map((player, index) => (
                player.id !== currentVoter.id && (
                  <button
                    key={player.id}
                    onClick={() => setSelectedVote(player.id)}
                    className={`player-item-card w-full flex items-center gap-3 p-3 text-left transition-all ${
                      selectedVote === player.id ? 'selected animate-bounce-in' : ''
                    }`}
                  >
                    <div 
                      className="player-avatar text-sm w-10 h-10"
                      style={{ background: getPlayerColor(index) }}
                    >
                      {getPlayerAvatar(index)}
                    </div>
                    <span className="font-bold text-lg flex-1">{player.name}</span>
                    {selectedVote === player.id && (
                      <span className="text-2xl animate-wiggle">🎯</span>
                    )}
                  </button>
                )
              ))}
            </div>
          </div>

          <button
            onClick={handleCastVote}
            disabled={!selectedVote}
            className={`w-full py-4 text-lg font-bold rounded-2xl transition-all ${
              selectedVote
                ? 'btn-cartoon btn-cartoon-danger'
                : 'cursor-not-allowed rounded-2xl'
            }`}
            style={!selectedVote ? { background: '#e5e7eb', color: '#9ca3af', border: '2px solid #d1d5db' } : undefined}
          >
            {selectedVote ? '✅ Cast Vote!' : 'Select a player...'}
          </button>
        </>
      ) : (
        <>
          {/* All votes cast */}
          <div className="cartoon-card p-6 mb-5 text-center animate-fade-in-scale">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              All Votes In!
            </h3>
            <p className="text-gray-600">
              The votes have been cast. Time for the big reveal!
            </p>
          </div>

          {/* Vote summary */}
          <div className="space-y-2 mb-5">
            <h4 className="section-title text-base mb-2">📊 Vote Summary</h4>
            {players.map((player, index) => (
              <div key={player.id} className="cartoon-card p-3 flex items-center gap-3">
                <div 
                  className="player-avatar text-xs w-8 h-8"
                  style={{ background: getPlayerColor(index) }}
                >
                  {getPlayerAvatar(index)}
                </div>
                <span className="font-bold text-sm">{player.name}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className="font-bold text-red-500 text-sm">
                  {players.find(p => p.id === votes[player.id])?.name}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onShowResults}
            className="btn-cartoon btn-cartoon-warning w-full py-4 text-lg"
          >
            🎉 Show Results!
          </button>
        </>
      )}
    </div>
  );
}
