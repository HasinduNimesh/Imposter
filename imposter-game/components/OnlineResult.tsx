'use client';

import { LobbyState, GameResults } from '@/lib/onlineTypes';
import { getPlayerColor, getPlayerAvatar, DetectiveNarrator } from './CartoonElements';

interface OnlineResultProps {
  lobby: LobbyState;
  myId: string;
  results: GameResults;
  onNewGame: () => void;
  onLeaveLobby: () => void;
}

export default function OnlineResult({
  lobby,
  myId,
  results,
  onNewGame,
  onLeaveLobby,
}: OnlineResultProps) {
  const isHost = lobby.hostId === myId;
  const isImposter = results.imposterIds.includes(myId);

  // Count votes per player
  const voteCount: { [id: string]: number } = {};
  Object.values(results.votes).forEach((votedId) => {
    voteCount[votedId] = (voteCount[votedId] || 0) + 1;
  });

  // Sort players by vote count
  const sortedPlayers = [...lobby.players].sort((a, b) => {
    return (voteCount[b.id] || 0) - (voteCount[a.id] || 0);
  });

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DetectiveNarrator mood="shocked" size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">Results!</h2>
          <p className="text-gray-500 text-sm mt-1">The truth is revealed...</p>
        </div>
      </div>

      {/* Win/Loss Banner */}
      <div
        className={`rounded-2xl p-5 mb-6 text-center border-2 ${
          results.impostersWin
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}
      >
        <div className="text-5xl mb-2 animate-bounce-in">
          {results.impostersWin ? '🕵️' : '🎉'}
        </div>
        <p
          className={`font-black text-2xl ${
            results.impostersWin ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {results.impostersWin ? 'Imposters Win!' : 'Imposter Caught!'}
        </p>
        <p
          className={`text-sm mt-1 ${
            results.impostersWin ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {results.impostersWin
            ? 'The imposter managed to blend in!'
            : 'The group found the imposter!'}
        </p>
      </div>

      {/* Your Role */}
      <div
        className={`rounded-xl p-3 mb-4 text-center border-2 ${
          isImposter
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <p className={`font-bold text-sm ${isImposter ? 'text-red-600' : 'text-blue-600'}`}>
          {isImposter
            ? `You were the Imposter! ${results.impostersWin ? '😎' : '😔'}`
            : `You were innocent! ${results.impostersWin ? '😔' : '🎉'}`}
        </p>
      </div>

      {/* The Word */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6 text-center">
        <p className="text-purple-400 text-xs uppercase tracking-widest font-bold">
          The Secret Word Was
        </p>
        <p className="text-3xl font-black text-purple-700 mt-1">{results.word}</p>
      </div>

      {/* Imposters Reveal */}
      <div className="mb-4">
        <h3 className="section-title text-sm mb-2">
          🕵️ {results.imposterIds.length > 1 ? 'Imposters' : 'Imposter'}:
        </h3>
        <div className="flex flex-wrap gap-2">
          {results.imposterIds.map((id) => {
            const player = lobby.players.find((p) => p.id === id);
            const index = lobby.players.findIndex((p) => p.id === id);
            if (!player) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2"
              >
                <div
                  className="player-avatar text-sm w-7 h-7"
                  style={{ background: getPlayerColor(index) }}
                >
                  {getPlayerAvatar(index)}
                </div>
                <span className="font-bold text-red-700 text-sm">{player.name}</span>
                {id === myId && (
                  <span className="text-xs text-red-400">(You)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Imposter Word Guess */}
      {results.imposterGuess !== undefined && results.imposterGuess !== '' && (
        <div
          className={`rounded-xl p-4 mb-4 text-center border-2 ${
            results.imposterGuessCorrect
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <p className="text-xs uppercase tracking-widest font-bold mb-1 text-gray-500">
            Imposter&apos;s Word Guess
          </p>
          <p className={`text-xl font-black ${
            results.imposterGuessCorrect ? 'text-green-600' : 'text-red-600'
          }`}>
            &quot;{results.imposterGuess}&quot; {results.imposterGuessCorrect ? '✅ Correct! (+20 pts)' : '❌ Wrong!'}
          </p>
        </div>
      )}

      {/* Vote Results */}
      <div className="mb-6">
        <h3 className="section-title text-sm mb-3">🗳️ Vote Results</h3>
        <div className="space-y-2">
          {sortedPlayers.map((player) => {
            const index = lobby.players.findIndex((p) => p.id === player.id);
            const votes = voteCount[player.id] || 0;
            const isImp = results.imposterIds.includes(player.id);
            const maxVotes = Math.max(...Object.values(voteCount), 1);

            return (
              <div key={player.id} className="cartoon-card p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="player-avatar text-sm w-8 h-8"
                    style={{ background: getPlayerColor(index) }}
                  >
                    {getPlayerAvatar(index)}
                  </div>
                  <span className="font-semibold text-gray-800 flex-1">
                    {player.name}
                    {player.id === myId && (
                      <span className="text-xs text-purple-500 ml-1">(You)</span>
                    )}
                  </span>
                  {isImp && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                      🕵️ Imposter
                    </span>
                  )}
                  <span className="font-bold text-gray-700">{votes} vote{votes !== 1 ? 's' : ''}</span>
                </div>
                {/* Vote bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isImp ? 'bg-red-400' : 'bg-blue-400'
                    }`}
                    style={{ width: `${maxVotes > 0 ? (votes / maxVotes) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Round Points */}
      {results.roundPoints && Object.keys(results.roundPoints).length > 0 && (
        <div className="mb-4">
          <h3 className="section-title text-sm mb-3">⭐ Points This Round</h3>
          <div className="flex flex-wrap gap-2">
            {lobby.players
              .filter(p => (results.roundPoints[p.id] || 0) > 0)
              .sort((a, b) => (results.roundPoints[b.id] || 0) - (results.roundPoints[a.id] || 0))
              .map((player) => {
                const pts = results.roundPoints[player.id] || 0;
                const index = lobby.players.findIndex((p) => p.id === player.id);
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-200 rounded-xl px-3 py-2"
                  >
                    <div
                      className="player-avatar text-sm w-7 h-7"
                      style={{ background: getPlayerColor(index) }}
                    >
                      {getPlayerAvatar(index)}
                    </div>
                    <span className="font-bold text-gray-700 text-sm">{player.name}</span>
                    <span className="font-black text-yellow-600 text-sm">+{pts}</span>
                  </div>
                );
              })}
            {lobby.players.every(p => (results.roundPoints[p.id] || 0) === 0) && (
              <p className="text-gray-400 text-sm">No points earned this round</p>
            )}
          </div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="mb-6">
        <h3 className="section-title text-sm mb-3">🏆 Scoreboard</h3>
        <div className="space-y-2">
          {[...lobby.players]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((player, rank) => {
              const index = lobby.players.findIndex((p) => p.id === player.id);
              const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '';
              return (
                <div
                  key={player.id}
                  className={`cartoon-card p-3 flex items-center gap-3 ${
                    player.id === myId ? 'ring-2 ring-purple-300' : ''
                  }`}
                >
                  <span className="text-lg w-8 text-center">{medal || `#${rank + 1}`}</span>
                  <div
                    className="player-avatar text-sm w-8 h-8"
                    style={{ background: getPlayerColor(index) }}
                  >
                    {getPlayerAvatar(index)}
                  </div>
                  <span className="font-semibold text-gray-800 flex-1">
                    {player.name}
                    {player.id === myId && (
                      <span className="text-xs text-purple-500 ml-1">(You)</span>
                    )}
                  </span>
                  <span className="font-black text-purple-700 text-lg">{player.score || 0}</span>
                  <span className="text-xs text-gray-400">pts</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {isHost ? (
          <button
            onClick={onNewGame}
            className="btn-cartoon btn-cartoon-success w-full py-4 text-xl"
          >
            🔄 New Game (Same Lobby)
          </button>
        ) : (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-center">
            <p className="text-gray-500 text-sm">
              ⏳ Waiting for host to start a new game...
            </p>
          </div>
        )}
        <button
          onClick={onLeaveLobby}
          className="btn-cartoon w-full py-3 text-gray-500 hover:text-red-500 border-2 border-gray-200 hover:border-red-300"
        >
          🚪 Leave Lobby
        </button>
      </div>
    </div>
  );
}
