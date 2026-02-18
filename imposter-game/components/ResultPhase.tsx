import { Player } from '@/lib/types';
import { getPlayerColor, getPlayerAvatar, DetectiveNarrator, ImposterCharacter, Confetti } from './CartoonElements';

interface ResultPhaseProps {
  players: Player[];
  votes: { [playerId: string]: string };
  imposters: string[];
  word: string;
  onNewGame: () => void;
}

export default function ResultPhase({
  players,
  votes,
  imposters,
  word,
  onNewGame
}: ResultPhaseProps) {
  // Count votes for each player
  const voteCounts: { [playerId: string]: number } = {};
  Object.values(votes).forEach(votedForId => {
    voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
  });

  // Find player(s) with most votes
  const maxVotes = Math.max(...Object.values(voteCounts));
  const mostVotedIds = Object.keys(voteCounts).filter(
    id => voteCounts[id] === maxVotes
  );

  // Check if imposters were caught
  const impostersCaught = mostVotedIds.some(id => imposters.includes(id));
  const playersWin = imposters.every(id => mostVotedIds.includes(id)) && mostVotedIds.length === imposters.length;
  
  // Determine winner
  let result: 'players' | 'imposters' | 'tie';
  if (mostVotedIds.length > imposters.length && impostersCaught) {
    result = 'tie';
  } else if (playersWin) {
    result = 'players';
  } else {
    result = 'imposters';
  }

  const sortedPlayers = [...players].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up relative">
      {/* Confetti for player win */}
      {result === 'players' && <Confetti />}

      {/* Winner banner */}
      <div className={`rounded-2xl p-6 mb-5 text-center relative overflow-hidden ${
        result === 'players' 
          ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-2 border-emerald-300'
          : result === 'imposters'
          ? 'bg-gradient-to-br from-red-500 via-red-600 to-purple-700 border-2 border-red-400'
          : 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 border-2 border-amber-300'
      }`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)'
        }} />
        
        <div className="relative z-10">
          <div className="mb-3">
            {result === 'players' ? (
              <DetectiveNarrator mood="happy" size={70} />
            ) : result === 'imposters' ? (
              <ImposterCharacter size={70} />
            ) : (
              <DetectiveNarrator mood="thinking" size={70} />
            )}
          </div>
          
          <h3 className="game-title text-3xl md:text-4xl text-white mb-2">
            {result === 'players' && '🎉 PLAYERS WIN! 🎉'}
            {result === 'imposters' && '🎭 IMPOSTERS WIN! 🎭'}
            {result === 'tie' && '🤝 TIE GAME! 🤝'}
          </h3>
          <p className="text-lg text-white/90">
            {result === 'players' && 'The imposters were caught red-handed!'}
            {result === 'imposters' && 'The imposters fooled everyone!'}
            {result === 'tie' && 'No clear winner this round!'}
          </p>
        </div>
      </div>

      {/* Secret word reveal */}
      <div className="wood-surface p-5 mb-5 text-center">
        <p className="text-amber-200 text-sm font-medium mb-1">🔑 The Secret Word Was:</p>
        <p className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg animate-bounce-in">
          {word}
        </p>
      </div>

      {/* Imposter reveal */}
      <div className="cartoon-card p-4 mb-5 border-red-300 bg-red-50">
        <h4 className="section-title text-base mb-3">
          🎭 The Imposter{imposters.length > 1 ? 's were' : ' was'}:
        </h4>
        <div className="space-y-2">
          {players
            .filter(p => imposters.includes(p.id))
            .map((imposter) => {
              const idx = players.findIndex(p => p.id === imposter.id);
              return (
                <div key={imposter.id} className="flex items-center gap-3 bg-red-500 text-white rounded-xl p-3 animate-wiggle">
                  <div 
                    className="player-avatar text-sm w-10 h-10"
                    style={{ background: getPlayerColor(idx) }}
                  >
                    {getPlayerAvatar(idx)}
                  </div>
                  <span className="font-bold text-lg">{imposter.name}</span>
                  <span className="ml-auto text-2xl">🎭</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Vote results chart */}
      <div className="cartoon-card p-4 mb-5">
        <h4 className="section-title text-base mb-3">📊 Vote Results</h4>
        <div className="space-y-2">
          {sortedPlayers.map((player) => {
            const voteCount = voteCounts[player.id] || 0;
            const isImposter = imposters.includes(player.id);
            const wasMostVoted = mostVotedIds.includes(player.id);
            const idx = players.findIndex(p => p.id === player.id);
            const barWidth = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

            return (
              <div
                key={player.id}
                className={`rounded-xl p-3 transition-all ${
                  wasMostVoted
                    ? 'bg-amber-100 border-2 border-amber-400'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="player-avatar text-xs w-7 h-7"
                    style={{ background: getPlayerColor(idx) }}
                  >
                    {getPlayerAvatar(idx)}
                  </div>
                  <span className="font-bold text-sm flex-1">
                    {player.name}
                    {isImposter && ' 🎭'}
                  </span>
                  <span className="font-bold text-sm text-gray-700">
                    {voteCount} vote{voteCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Vote bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      wasMostVoted ? 'bg-amber-500' : 'bg-blue-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {wasMostVoted && (
                  <p className="text-xs text-amber-700 font-bold mt-1">⭐ Most Voted</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual votes */}
      <details className="cartoon-card p-4 mb-5 cursor-pointer">
        <summary className="section-title text-base">🔍 Who Voted for Whom</summary>
        <div className="space-y-1 mt-3">
          {players.map((player, index) => (
            <div key={player.id} className="flex items-center gap-2 text-sm py-1">
              <div 
                className="player-avatar text-xs w-6 h-6"
                style={{ background: getPlayerColor(index) }}
              >
                {getPlayerAvatar(index)}
              </div>
              <span className="font-bold">{player.name}</span>
              <span className="text-gray-400">→</span>
              <span className="font-bold text-red-500">
                {players.find(p => p.id === votes[player.id])?.name}
              </span>
            </div>
          ))}
        </div>
      </details>

      <button
        onClick={onNewGame}
        className="btn-cartoon btn-cartoon-success w-full py-4 text-lg"
      >
        🎮 Play Again!
      </button>
    </div>
  );
}
