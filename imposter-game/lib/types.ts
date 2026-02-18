export interface Player {
  id: string;
  name: string;
  isImposter: boolean;
  votedFor: string | null;
}

export interface GameSettings {
  numberOfImposters: number;
  category: string;
  numberOfConversations: number;
  useHintForImposter: boolean;
}

export interface GameState {
  phase: 'setup' | 'settings' | 'reveal' | 'conversation' | 'voting' | 'result';
  players: Player[];
  settings: GameSettings | null;
  currentWord: string | null;
  currentHint: string | null;
  currentPlayerRevealIndex: number;
  currentSpeakerIndex: number;
  conversationRound: number;
  votes: { [playerId: string]: string };
  imposters: string[];
}

export const initialGameState: GameState = {
  phase: 'setup',
  players: [],
  settings: null,
  currentWord: null,
  currentHint: null,
  currentPlayerRevealIndex: 0,
  currentSpeakerIndex: 0,
  conversationRound: 1,
  votes: {},
  imposters: []
};
