'use client';

import { useState } from 'react';
import { GameState, Player, GameSettings, initialGameState } from '@/lib/types';
import { wordDatabase } from '@/lib/wordDatabase';
import PlayerSetup from '@/components/PlayerSetup';
import GameSettingsPage from '@/components/GameSettingsPage';
import WordReveal from '@/components/WordReveal';
import ConversationPhase from '@/components/ConversationPhase';
import VotingPhase from '@/components/VotingPhase';
import ResultPhase from '@/components/ResultPhase';
import ModeSelection from '@/components/ModeSelection';
import OnlineGame from '@/components/OnlineGame';
import { DecoItems, DetectiveNarrator } from '@/components/CartoonElements';

type GameMode = 'select' | 'local' | 'online';

export default function Home() {
  const [gameMode, setGameMode] = useState<GameMode>('select');
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      isImposter: false,
      votedFor: null
    };
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
  };

  const removePlayer = (id: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== id)
    }));
  };

  const startGameSetup = () => {
    if (gameState.players.length >= 3) {
      setGameState(prev => ({ ...prev, phase: 'settings' }));
    }
  };

  const startGame = (settings: GameSettings) => {
    // Select random word from category
    const wordsInCategory = wordDatabase[settings.category];
    const randomWordItem = wordsInCategory[Math.floor(Math.random() * wordsInCategory.length)];
    
    // Randomly select imposters
    const playerIds = gameState.players.map(p => p.id);
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const imposterIds = shuffled.slice(0, settings.numberOfImposters);
    
    // Update players with imposter status
    const updatedPlayers = gameState.players.map(p => ({
      ...p,
      isImposter: imposterIds.includes(p.id),
      votedFor: null
    }));

    setGameState(prev => ({
      ...prev,
      phase: 'reveal',
      settings,
      currentWord: randomWordItem.word,
      currentHint: randomWordItem.hint,
      players: updatedPlayers,
      currentPlayerRevealIndex: 0,
      imposters: imposterIds,
      votes: {}
    }));
  };

  const nextPlayerReveal = () => {
    if (gameState.currentPlayerRevealIndex < gameState.players.length - 1) {
      setGameState(prev => ({
        ...prev,
        currentPlayerRevealIndex: prev.currentPlayerRevealIndex + 1
      }));
    } else {
      // All players have seen their word, start conversation
      const randomSpeakerIndex = Math.floor(Math.random() * gameState.players.length);
      setGameState(prev => ({
        ...prev,
        phase: 'conversation',
        currentSpeakerIndex: randomSpeakerIndex,
        conversationRound: 1
      }));
    }
  };

  const startVoting = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'voting'
    }));
  };

  const castVote = (voterId: string, votedForId: string) => {
    setGameState(prev => ({
      ...prev,
      votes: { ...prev.votes, [voterId]: votedForId }
    }));
  };

  const showResults = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'result'
    }));
  };

  const resetGame = () => {
    setGameState({
      ...initialGameState,
      players: gameState.players.map(p => ({
        ...p,
        isImposter: false,
        votedFor: null
      }))
    });
  };

  return (
    <div className="game-bg min-h-screen p-4 relative">
      {/* Decorative side items */}
      <DecoItems side="left" />
      <DecoItems side="right" />

      {/* Main content */}
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Animated Title with Narrator */}
        <div className="text-center mb-6 pt-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <DetectiveNarrator 
              mood={
                gameState.phase === 'result' ? 'shocked' : 
                gameState.phase === 'voting' ? 'thinking' :
                gameState.phase === 'reveal' ? 'wink' :
                'happy'
              } 
              size={70} 
            />
            <h1 className="game-title text-4xl md:text-5xl font-bold">
              IMPOSTER
            </h1>
          </div>
          <p className="text-purple-300 text-sm tracking-widest uppercase font-medium">
            Find the imposter among you
          </p>
        </div>

        {/* Game Content */}
        <div className="animate-fade-in">
          {/* Mode Selection */}
          {gameMode === 'select' && (
            <ModeSelection
              onSelectLocal={() => setGameMode('local')}
              onSelectOnline={() => setGameMode('online')}
            />
          )}

          {/* Online Mode */}
          {gameMode === 'online' && (
            <OnlineGame onBack={() => setGameMode('select')} />
          )}

          {/* Local Mode */}
          {gameMode === 'local' && (
            <>
              {gameState.phase === 'setup' && (
                <div>
                  <PlayerSetup
                    players={gameState.players}
                    onAddPlayer={addPlayer}
                    onRemovePlayer={removePlayer}
                    onStartGame={startGameSetup}
                  />
                  <button
                    onClick={() => {
                      setGameMode('select');
                      setGameState(initialGameState);
                    }}
                    className="btn-cartoon w-full py-3 mt-4 text-gray-500 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-300 max-w-2xl mx-auto block"
                  >
                    ← Back to Mode Selection
                  </button>
                </div>
              )}

              {gameState.phase === 'settings' && (
                <GameSettingsPage
                  players={gameState.players}
                  onStartGame={startGame}
                  onBack={() => setGameState(prev => ({ ...prev, phase: 'setup' }))}
                />
              )}

              {gameState.phase === 'reveal' && (
                <WordReveal
                  players={gameState.players}
                  currentPlayerIndex={gameState.currentPlayerRevealIndex}
                  word={gameState.currentWord!}
                  hint={gameState.currentHint!}
                  useHint={gameState.settings!.useHintForImposter}
                  onNext={nextPlayerReveal}
                />
              )}

              {gameState.phase === 'conversation' && (
                <ConversationPhase
                  players={gameState.players}
                  currentSpeakerIndex={gameState.currentSpeakerIndex}
                  conversationRound={gameState.conversationRound}
                  totalRounds={gameState.settings!.numberOfConversations}
                  onStartVoting={startVoting}
                />
              )}

              {gameState.phase === 'voting' && (
                <VotingPhase
                  players={gameState.players}
                  votes={gameState.votes}
                  onVote={castVote}
                  onShowResults={showResults}
                />
              )}

              {gameState.phase === 'result' && (
                <ResultPhase
                  players={gameState.players}
                  votes={gameState.votes}
                  imposters={gameState.imposters}
                  word={gameState.currentWord!}
                  onNewGame={resetGame}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
