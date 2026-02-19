// Types shared between server and client for online multiplayer

export interface LobbyPlayer {
  id: string; // socket ID
  name: string;
  isHost: boolean;
  isReady: boolean;
  hasRevealedWord: boolean;
  hasVoted: boolean;
}

export interface LobbySettings {
  numberOfImposters: number;
  category: string;
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
}

// ===== Socket Event Types =====

// Client -> Server events
export interface ClientToServerEvents {
  'create-lobby': (playerName: string) => void;
  'join-lobby': (data: { code: string; playerName: string }) => void;
  'leave-lobby': () => void;
  'start-settings': () => void;
  'start-game': (settings: LobbySettings) => void;
  'word-revealed': () => void;
  'cast-vote': (votedForId: string) => void;
  'new-game': () => void;
  'kick-player': (playerId: string) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  'lobby-created': (data: { code: string; lobby: LobbyState }) => void;
  'lobby-joined': (data: { lobby: LobbyState; playerId: string }) => void;
  'lobby-updated': (lobby: LobbyState) => void;
  'player-joined': (data: { player: LobbyPlayer; lobby: LobbyState }) => void;
  'player-left': (data: { playerId: string; lobby: LobbyState }) => void;
  'settings-phase': (lobby: LobbyState) => void;
  'game-started': (data: { lobby: LobbyState; playerData: PlayerGameData }) => void;
  'all-revealed': (lobby: LobbyState) => void;
  'phase-changed': (lobby: LobbyState) => void;
  'vote-update': (data: { votedCount: number; totalPlayers: number }) => void;
  'game-results': (results: GameResults) => void;
  'player-kicked': (data: { playerId: string }) => void;
  'error': (message: string) => void;
}
