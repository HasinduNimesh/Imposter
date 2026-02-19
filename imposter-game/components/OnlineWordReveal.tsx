'use client';

import { useState } from 'react';
import { PlayerGameData, LobbyState } from '@/lib/onlineTypes';
import { getPlayerColor, getPlayerAvatar, DetectiveNarrator } from './CartoonElements';

interface OnlineWordRevealProps {
  lobby: LobbyState;
  myId: string;
  playerData: PlayerGameData;
  onRevealed: () => void;
}

export default function OnlineWordReveal({
  lobby,
  myId,
  playerData,
  onRevealed,
}: OnlineWordRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const myPlayer = lobby.players.find((p) => p.id === myId);
  const myIndex = lobby.players.findIndex((p) => p.id === myId);
  const revealedCount = lobby.players.filter((p) => p.hasRevealedWord).length;

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onRevealed();
  };

  if (confirmed) {
    return (
      <div className="dialog-panel p-6 md:p-8 animate-slide-up">
        <div className="flex items-center gap-4 mb-6">
          <DetectiveNarrator mood="happy" size={60} />
          <div>
            <h2 className="section-title text-2xl md:text-3xl">All Set!</h2>
            <p className="text-gray-500 text-sm mt-1">
              Waiting for other players to see their word...
            </p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="text-5xl mb-4 animate-float">✅</div>
          <p className="text-gray-500 font-medium text-lg mb-4">
            You&apos;re ready! ({revealedCount}/{lobby.players.length} players ready)
          </p>
          {/* Progress */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-linear-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${(revealedCount / lobby.players.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Player status */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {lobby.players.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                p.hasRevealedWord ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div
                className="player-avatar text-sm w-8 h-8"
                style={{ background: getPlayerColor(i) }}
              >
                {getPlayerAvatar(i)}
              </div>
              <span className="text-sm font-medium text-gray-700 truncate flex-1">
                {p.name}
              </span>
              <span>{p.hasRevealedWord ? '✅' : '⏳'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DetectiveNarrator mood={revealed ? 'wink' : 'thinking'} size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">
            {revealed ? 'Your Role' : 'Ready to See Your Role?'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {myPlayer?.name}, this is private — don&apos;t show anyone!
          </p>
        </div>
      </div>

      {!revealed ? (
        <div className="text-center py-8">
          <div
            className="player-avatar text-4xl mx-auto mb-4 w-20 h-20"
            style={{ background: getPlayerColor(myIndex) }}
          >
            {getPlayerAvatar(myIndex)}
          </div>
          <p className="text-gray-600 font-medium mb-6">
            Make sure no one else can see your screen!
          </p>
          <button
            onClick={handleReveal}
            className="btn-cartoon btn-cartoon-primary py-4 px-10 text-xl"
          >
            👁️ Reveal My Role
          </button>
        </div>
      ) : (
        <div className="text-center py-6 animate-fade-in">
          {playerData.isImposter ? (
            <>
              <div className="text-6xl mb-4 animate-bounce-in">🕵️</div>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-4">
                <p className="text-red-600 font-black text-2xl mb-2">
                  YOU ARE THE IMPOSTER!
                </p>
                <p className="text-red-400 text-sm">
                  You don&apos;t know the word. Blend in and don&apos;t get caught!
                </p>
                {playerData.hint && (
                  <div className="mt-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                    <p className="text-amber-600 text-sm font-bold">
                      💡 Hint: {playerData.hint}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4 animate-bounce-in">✨</div>
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-4">
                <p className="text-green-500 font-bold text-sm uppercase tracking-widest mb-2">
                  Your Secret Word
                </p>
                <p className="text-3xl font-black text-green-700">{playerData.word}</p>
                <p className="text-green-400 text-sm mt-2">
                  Describe this word without saying it directly!
                </p>
              </div>
            </>
          )}

          <button
            onClick={handleConfirm}
            className="btn-cartoon btn-cartoon-success py-4 px-10 text-xl mt-2"
          >
            ✅ Got It!
          </button>
        </div>
      )}
    </div>
  );
}
