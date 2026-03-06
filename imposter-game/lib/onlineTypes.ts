// Types shared between server and client for online multiplayer

export interface LobbyPlayer {
  id: string; // socket ID
  name: string;
  isHost: boolean;
  isReady: boolean;
  hasRevealedWord: boolean;
  hasVoted: boolean;
  isDisconnected?: boolean; // true when player temporarily disconnected
  score: number; // cumulative points across rounds
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LobbySettings {
  numberOfImposters: number;
  category: string;
  customCategory: string;  // user-typed custom topic (empty = use preset category)
  difficulty: Difficulty;
  numberOfConversations: number;
  useHintForImposter: boolean;
}

export type OnlinePhase =
  | 'waiting'      // waiting room
  | 'settings'     // host picking settings
  | 'reveal'       // each player sees their word
  | 'conversation' // discussion phase
  | 'voting'       // everyone votes
  | 'result';      // results shown

export interface LobbyState {
  code: string;
  phase: OnlinePhase;
  players: LobbyPlayer[];
  hostId: string;
  settings: LobbySettings | null;
  conversationRound: number;
  totalRounds: number;
}

// What each player receives privately
export interface PlayerGameData {
  isImposter: boolean;
  word: string | null;   // null if imposter and no hint
  hint: string | null;   // hint if imposter and useHint enabled
}

// Vote results sent to all players
export interface GameResults {
  votes: { [voterId: string]: string }; // voterId -> votedForId
  imposterIds: string[];
  word: string;
  impostersWin: boolean;
  roundPoints: { [playerId: string]: number }; // points earned this round
  imposterGuess?: string; // what the imposter guessed
  imposterGuessCorrect?: boolean; // whether the guess was correct
}

// Chat message
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'player' | 'system';
}

// ===== Socket Event Types =====

// Client -> Server events
export interface ClientToServerEvents {
  'create-lobby': (playerName: string) => void;
  'join-lobby': (data: { code: string; playerName: string }) => void;
  'rejoin-lobby': (data: { code: string; playerName: string }) => void;
  'leave-lobby': () => void;
  'start-settings': () => void;
  'start-game': (settings: LobbySettings) => void;
  'word-revealed': () => void;
  'cast-vote': (votedForId: string) => void;
  'imposter-guess': (guess: string) => void;
  'new-game': () => void;
  'kick-player': (playerId: string) => void;
  'send-message': (text: string) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  'lobby-created': (data: { code: string; lobby: LobbyState }) => void;
  'lobby-joined': (data: { lobby: LobbyState; playerId: string }) => void;
  'lobby-updated': (lobby: LobbyState) => void;
  'player-joined': (data: { player: LobbyPlayer; lobby: LobbyState }) => void;
  'player-left': (data: { playerId: string; lobby: LobbyState }) => void;
  'player-disconnected': (data: { playerId: string; playerName: string; lobby: LobbyState }) => void;
  'player-reconnected': (data: { playerId: string; playerName: string; lobby: LobbyState }) => void;
  'host-changed': (data: { newHostId: string; newHostName: string; lobby: LobbyState }) => void;
  'settings-phase': (lobby: LobbyState) => void;
  'game-started': (data: { lobby: LobbyState; playerData: PlayerGameData }) => void;
  'rejoined-game': (data: { lobby: LobbyState; playerData: PlayerGameData | null; gameResults: GameResults | null }) => void;
  'all-revealed': (lobby: LobbyState) => void;
  'phase-changed': (lobby: LobbyState) => void;
  'vote-update': (data: { votedCount: number; totalPlayers: number }) => void;
  'game-results': (results: GameResults) => void;
  'imposter-guess-prompt': () => void;
  'player-kicked': (data: { playerId: string }) => void;
  'chat-message': (message: ChatMessage) => void;
  'chat-history': (messages: ChatMessage[]) => void;
  'error': (message: string) => void;
}
