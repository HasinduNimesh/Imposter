'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { connectSocket, disconnectSocket, type GameSocket } from '@/lib/socketClient';
import type {
  LobbyState,
  LobbySettings,
  PlayerGameData,
  GameResults,
  ChatMessage,
} from '@/lib/onlineTypes';
import OnlineLobbyJoin from './OnlineLobbyJoin';
import OnlineWaitingRoom from './OnlineWaitingRoom';
import OnlineSettings from './OnlineSettings';
import OnlineWordReveal from './OnlineWordReveal';
import OnlineConversation from './OnlineConversation';
import OnlineVoting from './OnlineVoting';
import OnlineResult from './OnlineResult';
import ImposterGuessModal from './ImposterGuessModal';
import VoiceChatBar from './VoiceChatBar';
import ChatPanel from './ChatPanel';
import { useVoiceChat } from '@/lib/useVoiceChat';

type OnlineScreen = 'join' | 'lobby';

interface OnlineGameProps {
  onBack: () => void;
}

// Session persistence keys
const SESSION_KEY_CODE = 'imposter_lobby_code';
const SESSION_KEY_NAME = 'imposter_player_name';

export default function OnlineGame({ onBack }: OnlineGameProps) {
  const [screen, setScreen] = useState<OnlineScreen>('join');
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [playerData, setPlayerData] = useState<PlayerGameData | null>(null);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedCount, setVotedCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showImposterGuess, setShowImposterGuess] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isChatOpenRef = useRef(false);

  // Voice chat
  const voice = useVoiceChat(
    socket,
    myId,
    lobby?.code || null,
    lobby?.players.map(p => ({ id: p.id, name: p.name })) || []
  );

  // Keep isChatOpenRef in sync
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

  // Use ref to track if we've setup listeners to avoid duplicates
  const listenersSetup = useRef(false);
  const reconnectAttempted = useRef(false);

  // Show a temporary toast notification
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Save session info for rejoin
  const saveSession = useCallback((code: string, name: string) => {
    try {
      sessionStorage.setItem(SESSION_KEY_CODE, code);
      sessionStorage.setItem(SESSION_KEY_NAME, name);
    } catch { /* ignore in case sessionStorage unavailable */ }
  }, []);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY_CODE);
      sessionStorage.removeItem(SESSION_KEY_NAME);
    } catch { /* ignore */ }
  }, []);

  const getSession = useCallback((): { code: string; name: string } | null => {
    try {
      const code = sessionStorage.getItem(SESSION_KEY_CODE);
      const name = sessionStorage.getItem(SESSION_KEY_NAME);
      if (code && name) return { code, name };
    } catch { /* ignore */ }
    return null;
  }, []);

  const setupListeners = useCallback((s: GameSocket) => {
    if (listenersSetup.current) return;
    listenersSetup.current = true;

    s.on('connect', () => {
      setMyId(s.id || '');

      // If we were in a game and got disconnected, attempt auto-rejoin
      const session = (() => {
        try {
          const code = sessionStorage.getItem(SESSION_KEY_CODE);
          const name = sessionStorage.getItem(SESSION_KEY_NAME);
          if (code && name) return { code, name };
        } catch { /* ignore */ }
        return null;
      })();

      if (session && !reconnectAttempted.current) {
        reconnectAttempted.current = true;
        setIsReconnecting(true);
        s.emit('rejoin-lobby', { code: session.code, playerName: session.name });
      }
    });

    s.on('lobby-created', ({ code, lobby: lobbyData }) => {
      console.log('Lobby created:', code);
      setLobby(lobbyData);
      setScreen('lobby');
      setIsConnecting(false);
      setIsReconnecting(false);
      setError(null);
      // Save session for rejoin
      const me = lobbyData.players.find(p => p.id === s.id);
      if (me) saveSession(code, me.name);
    });

    s.on('lobby-joined', ({ lobby: lobbyData, playerId }) => {
      console.log('Joined lobby as:', playerId);
      setMyId(playerId);
      setLobby(lobbyData);
      setScreen('lobby');
      setIsConnecting(false);
      setIsReconnecting(false);
      setError(null);
      const me = lobbyData.players.find(p => p.id === playerId);
      if (me) saveSession(lobbyData.code, me.name);
    });

    s.on('rejoined-game', ({ lobby: lobbyData, playerData: pd, gameResults: gr }) => {
      console.log('Rejoined game in lobby:', lobbyData.code);
      setMyId(s.id || '');
      setLobby(lobbyData);
      setPlayerData(pd);
      setGameResults(gr);
      setScreen('lobby');
      setIsConnecting(false);
      setIsReconnecting(false);
      setError(null);
      showToast('Reconnected to the game!');
    });

    s.on('lobby-updated', (lobbyData) => {
      setLobby(lobbyData);
      if (lobbyData.phase === 'waiting') {
        setPlayerData(null);
        setGameResults(null);
        setHasVoted(false);
        setVotedCount(0);
      }
    });

    s.on('player-joined', ({ lobby: lobbyData }) => {
      setLobby(lobbyData);
    });

    s.on('player-left', ({ lobby: lobbyData }) => {
      setLobby(lobbyData);
    });

    s.on('player-disconnected', ({ playerName, lobby: lobbyData }) => {
      setLobby(lobbyData);
      showToast(`${playerName} lost connection — waiting for them to rejoin...`);
    });

    s.on('player-reconnected', ({ playerName, lobby: lobbyData }) => {
      setLobby(lobbyData);
      showToast(`${playerName} reconnected!`);
    });

    s.on('host-changed', ({ newHostName, lobby: lobbyData }) => {
      setLobby(lobbyData);
      showToast(`${newHostName} is now the host`);
    });

    s.on('settings-phase', (lobbyData) => {
      setLobby(lobbyData);
    });

    s.on('game-started', ({ lobby: lobbyData, playerData: pd }) => {
      setLobby(lobbyData);
      setPlayerData(pd);
      setGameResults(null);
      setHasVoted(false);
      setVotedCount(0);
    });

    s.on('all-revealed', (lobbyData) => {
      setLobby(lobbyData);
    });

    s.on('phase-changed', (lobbyData) => {
      setLobby(lobbyData);
    });

    s.on('vote-update', ({ votedCount: vc }) => {
      setVotedCount(vc);
    });

    s.on('game-results', (results) => {
      setGameResults(results);
      setShowImposterGuess(false);
    });

    s.on('imposter-guess-prompt', () => {
      setShowImposterGuess(true);
    });

    s.on('player-kicked', ({ playerId }) => {
      if (playerId === s.id) {
        clearSession();
        setLobby(null);
        setScreen('join');
        setError('You were kicked from the lobby.');
      }
    });

    s.on('error', (message) => {
      setError(message);
      setIsConnecting(false);
      setIsReconnecting(false);
    });

    s.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      if (reason !== 'io client disconnect') {
        // Unintentional disconnect — show reconnecting state
        showToast('Connection lost — reconnecting...');
        reconnectAttempted.current = false; // allow auto-rejoin on reconnect
      }
    });

    // ---- Chat listeners ----
    s.on('chat-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      if (!isChatOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    });

    s.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
      setUnreadCount(0);
    });
  }, [saveSession, clearSession, showToast]);

  // On mount, check if there's a saved session and try to auto-reconnect
  useEffect(() => {
    const session = getSession();
    if (session && !socket) {
      setIsReconnecting(true);
      const s = connectSocket();
      setSocket(s);
      setupListeners(s);
    }

    return () => {
      listenersSetup.current = false;
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureConnected = useCallback((): GameSocket => {
    let s = socket;
    if (!s || !s.connected) {
      s = connectSocket();
      setSocket(s);
      setupListeners(s);
      if (s.id) setMyId(s.id);
      s.on('connect', () => {
        setMyId(s!.id || '');
      });
    }
    return s;
  }, [socket, setupListeners]);

  // ---- Actions ----

  const handleCreateLobby = (playerName: string) => {
    setIsConnecting(true);
    setError(null);
    reconnectAttempted.current = true; // don't auto-rejoin old session
    clearSession();
    const s = ensureConnected();
    const emit = () => s.emit('create-lobby', playerName);
    if (s.connected) {
      emit();
    } else {
      s.once('connect', emit);
    }
  };

  const handleJoinLobby = (code: string, playerName: string) => {
    setIsConnecting(true);
    setError(null);
    reconnectAttempted.current = true;
    clearSession();
    const s = ensureConnected();
    const emit = () => s.emit('join-lobby', { code, playerName });
    if (s.connected) {
      emit();
    } else {
      s.once('connect', emit);
    }
  };

  const handleRejoinLobby = (code: string, playerName: string) => {
    setIsConnecting(true);
    setError(null);
    reconnectAttempted.current = true;
    const s = ensureConnected();
    const emit = () => s.emit('rejoin-lobby', { code, playerName });
    if (s.connected) {
      emit();
    } else {
      s.once('connect', emit);
    }
  };

  const handleLeaveLobby = () => {
    voice.cleanupAll();
    socket?.emit('leave-lobby');
    // Only clear session in waiting phase; during a game the server keeps
    // the player slot so they can rejoin with the same name & code
    if (!lobby || lobby.phase === 'waiting') {
      clearSession();
    }
    setLobby(null);
    setPlayerData(null);
    setGameResults(null);
    setScreen('join');
    setHasVoted(false);
    setVotedCount(0);
    setError(null);
    setMessages([]);
    setIsChatOpen(false);
    setUnreadCount(0);
  };

  const handleSendMessage = (text: string) => {
    socket?.emit('send-message', text);
  };

  const handleStartSettings = () => {
    socket?.emit('start-settings');
  };

  const handleStartGame = (settings: LobbySettings) => {
    socket?.emit('start-game', settings);
  };

  const handleWordRevealed = () => {
    socket?.emit('word-revealed');
  };

  const handleVote = (votedForId: string) => {
    socket?.emit('cast-vote', votedForId);
    setHasVoted(true);
  };

  const handleImposterGuess = (guess: string) => {
    socket?.emit('imposter-guess', guess);
    setShowImposterGuess(false);
  };

  const handleNewGame = () => {
    socket?.emit('new-game');
  };

  const handleKickPlayer = (playerId: string) => {
    socket?.emit('kick-player', playerId);
  };

  const handleBackToModes = () => {
    voice.cleanupAll();
    handleLeaveLobby();
    disconnectSocket();
    listenersSetup.current = false;
    reconnectAttempted.current = false;
    setSocket(null);
    onBack();
  };

  // Voice chat bar to render in lobby phases
  const myPlayer = lobby?.players.find(p => p.id === myId);
  const voiceChatBar = lobby && lobby.phase !== 'waiting' ? (
    <VoiceChatBar
      isVoiceEnabled={voice.isVoiceEnabled}
      isMuted={voice.isMuted}
      voicePeers={voice.voicePeers}
      micError={voice.micError}
      onEnableVoice={voice.enableVoice}
      onDisableVoice={voice.disableVoice}
      onToggleMute={voice.toggleMute}
      players={lobby.players.map(p => ({ id: p.id, name: p.name }))}
      myId={myId}
      myName={myPlayer?.name || 'You'}
    />
  ) : null;

  const handleStartVoting = () => {
    if (lobby && socket) {
      // @ts-expect-error - custom event
      socket.emit('start-voting');
    }
  };

  // ---- Toast notification ----
  const toastEl = toast ? (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in max-w-sm text-center">
      {toast}
    </div>
  ) : null;

  // ---- Reconnecting overlay ----
  if (isReconnecting && !lobby) {
    return (
      <>
        {toastEl}
        <div className="dialog-panel p-8 animate-slide-up text-center">
          <div className="text-4xl mb-4 animate-bounce">🔄</div>
          <h2 className="section-title text-xl mb-2">Reconnecting...</h2>
          <p className="text-gray-500 text-sm mb-6">Trying to rejoin your game session</p>
          <button
            onClick={() => {
              setIsReconnecting(false);
              clearSession();
              reconnectAttempted.current = true;
            }}
            className="btn-cartoon w-full py-3 text-gray-500 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-300"
          >
            Cancel &amp; Go to Join Screen
          </button>
        </div>
      </>
    );
  }

  // ---- Render ----

  if (screen === 'join' || !lobby) {
    return (
      <>
        {toastEl}
        <OnlineLobbyJoin
          onCreateLobby={handleCreateLobby}
          onJoinLobby={handleJoinLobby}
          onRejoinLobby={handleRejoinLobby}
          onBack={handleBackToModes}
          error={error}
          isConnecting={isConnecting}
          pendingSession={getSession()}
        />
      </>
    );
  }

  // Render based on lobby phase
  const renderPhase = () => {
    switch (lobby.phase) {
      case 'waiting':
        return (
          <OnlineWaitingRoom
            lobby={lobby}
            myId={myId}
            onStartSettings={handleStartSettings}
            onLeaveLobby={handleLeaveLobby}
            onKickPlayer={handleKickPlayer}
          />
        );

      case 'settings':
        return (
          <>
            {voiceChatBar}
            <OnlineSettings
              lobby={lobby}
              myId={myId}
              onStartGame={handleStartGame}
            />
          </>
        );

      case 'reveal':
        if (!playerData) return null;
        return (
          <>
            {voiceChatBar}
            <OnlineWordReveal
              lobby={lobby}
              myId={myId}
              playerData={playerData}
              onRevealed={handleWordRevealed}
            />
          </>
        );

      case 'conversation':
        return (
          <>
            {voiceChatBar}
            <OnlineConversation
              lobby={lobby}
              myId={myId}
              onStartVoting={handleStartVoting}
            />
          </>
        );

      case 'voting':
        return (
          <>
            {voiceChatBar}
            <OnlineVoting
              lobby={lobby}
              myId={myId}
              hasVoted={hasVoted}
              votedCount={votedCount}
              onVote={handleVote}
            />
            {showImposterGuess && (
              <ImposterGuessModal onSubmitGuess={handleImposterGuess} />
            )}
          </>
        );

      case 'result':
        if (!gameResults) return null;
        return (
          <>
            {voiceChatBar}
            <OnlineResult
              lobby={lobby}
              myId={myId}
              results={gameResults}
              onNewGame={handleNewGame}
              onLeaveLobby={handleLeaveLobby}
            />
          </>
        );

      default:
        return null;
    }
  };

  const chatPanel = lobby ? (
    <ChatPanel
      messages={messages}
      onSendMessage={handleSendMessage}
      myId={myId}
      players={lobby.players.map(p => ({ id: p.id, name: p.name }))}
      isOpen={isChatOpen}
      onToggle={() => setIsChatOpen(prev => !prev)}
      unreadCount={unreadCount}
    />
  ) : null;

  return (
    <>
      {toastEl}
      {renderPhase()}
      {chatPanel}
    </>
  );
}
