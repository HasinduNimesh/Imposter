import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  LobbyState,
  LobbyPlayer,
  LobbySettings,
  PlayerGameData,
  GameResults,
  OnlinePhase,
} from '../lib/onlineTypes';
import { generateWords } from './wordGenerator';

// ======= Word Database (duplicated for server-side use) =======
interface WordItem { word: string; hint: string; }
interface WordDatabase { [category: string]: WordItem[]; }

// Import the categories list - we'll load a subset for the server
const wordDatabase: WordDatabase = {
  "Foods and Drinks": [
    { word: "Pizza", hint: "Italian" }, { word: "Sushi", hint: "Japanese" },
    { word: "Burger", hint: "Fast food" }, { word: "Pasta", hint: "Noodles" },
    { word: "Taco", hint: "Mexican" }, { word: "Coffee", hint: "Caffeine" },
    { word: "Tea", hint: "Herbal" }, { word: "Chocolate", hint: "Cocoa" },
    { word: "Ice Cream", hint: "Frozen" }, { word: "Steak", hint: "Beef" },
    { word: "Rice", hint: "Grain" }, { word: "Cheese", hint: "Dairy" },
    { word: "Banana", hint: "Yellow" }, { word: "Mango", hint: "Tropical" },
    { word: "Soup", hint: "Liquid" }, { word: "Pancake", hint: "Breakfast" },
    { word: "Cookie", hint: "Sweet biscuit" }, { word: "Cake", hint: "Birthday" },
    { word: "Milk", hint: "White drink" }, { word: "Juice", hint: "Fruit drink" },
  ],
  "Brands": [
    { word: "Apple", hint: "Fruit logo" }, { word: "Samsung", hint: "Korean tech" },
    { word: "Nike", hint: "Swoosh" }, { word: "Adidas", hint: "Three stripes" },
    { word: "Google", hint: "Search" }, { word: "Microsoft", hint: "Windows" },
    { word: "Amazon", hint: "Arrow smile" }, { word: "Tesla", hint: "Electric cars" },
    { word: "Netflix", hint: "Red N" }, { word: "Spotify", hint: "Green music" },
    { word: "Disney", hint: "Mickey Mouse" }, { word: "Ferrari", hint: "Red horse" },
    { word: "Sony", hint: "PlayStation" }, { word: "Intel", hint: "Inside" },
    { word: "Nvidia", hint: "Green graphics" }, { word: "YouTube", hint: "Red play" },
    { word: "McDonald's", hint: "Golden arches" }, { word: "Starbucks", hint: "Mermaid" },
    { word: "Gucci", hint: "Double G" }, { word: "Rolex", hint: "Crown watch" },
  ],
  "Daily Use Objects": [
    { word: "Phone", hint: "Call" }, { word: "Laptop", hint: "Portable computer" },
    { word: "Watch", hint: "Wrist time" }, { word: "Pen", hint: "Writing" },
    { word: "Glasses", hint: "Vision" }, { word: "Wallet", hint: "Money holder" },
    { word: "Keys", hint: "Unlock" }, { word: "Umbrella", hint: "Rain" },
    { word: "Mirror", hint: "Reflection" }, { word: "Clock", hint: "Time" },
    { word: "Headphones", hint: "Ears" }, { word: "Scissors", hint: "Cut" },
    { word: "Toothbrush", hint: "Dental" }, { word: "Towel", hint: "Dry" },
    { word: "Lamp", hint: "Light" }, { word: "Chair", hint: "Sit" },
    { word: "Table", hint: "Surface" }, { word: "Pillow", hint: "Head rest" },
    { word: "Remote", hint: "TV control" }, { word: "Bottle", hint: "Container" },
  ],
  "Sports": [
    { word: "Soccer", hint: "Football" }, { word: "Basketball", hint: "Hoop" },
    { word: "Tennis", hint: "Racket" }, { word: "Cricket", hint: "Bat and ball" },
    { word: "Swimming", hint: "Water" }, { word: "Golf", hint: "Hole in one" },
    { word: "Boxing", hint: "Ring" }, { word: "Volleyball", hint: "Net" },
    { word: "Badminton", hint: "Shuttle" }, { word: "Rugby", hint: "Oval ball" },
    { word: "Hockey", hint: "Stick" }, { word: "Baseball", hint: "Diamond" },
    { word: "Surfing", hint: "Waves" }, { word: "Skiing", hint: "Snow" },
    { word: "Wrestling", hint: "Mat" }, { word: "Archery", hint: "Bow" },
    { word: "Fencing", hint: "Sword" }, { word: "Karate", hint: "Martial art" },
    { word: "Cycling", hint: "Bicycle" }, { word: "Skating", hint: "Ice" },
  ],
  "Movies and TV Shows": [
    { word: "Inception", hint: "Dreams" }, { word: "Titanic", hint: "Ship" },
    { word: "Avatar", hint: "Blue aliens" }, { word: "Matrix", hint: "Red pill" },
    { word: "Shrek", hint: "Green ogre" }, { word: "Frozen", hint: "Let it go" },
    { word: "Batman", hint: "Dark knight" }, { word: "Friends", hint: "Central Perk" },
    { word: "Stranger Things", hint: "Upside Down" }, { word: "Breaking Bad", hint: "Chemistry" },
    { word: "Game of Thrones", hint: "Winter" }, { word: "The Office", hint: "Paper company" },
    { word: "Squid Game", hint: "Korean survival" }, { word: "Harry Potter", hint: "Wizard" },
    { word: "Star Wars", hint: "Force" }, { word: "Spider-Man", hint: "Web slinger" },
    { word: "Iron Man", hint: "Suit" }, { word: "Joker", hint: "Clown villain" },
    { word: "Toy Story", hint: "Animated toys" }, { word: "The Lion King", hint: "Simba" },
  ],
  "Countries": [
    { word: "Japan", hint: "Rising sun" }, { word: "France", hint: "Eiffel Tower" },
    { word: "Brazil", hint: "Carnival" }, { word: "Egypt", hint: "Pyramids" },
    { word: "Australia", hint: "Kangaroo" }, { word: "India", hint: "Taj Mahal" },
    { word: "Italy", hint: "Pizza land" }, { word: "Canada", hint: "Maple leaf" },
    { word: "Germany", hint: "Beer" }, { word: "Mexico", hint: "Sombrero" },
    { word: "China", hint: "Great Wall" }, { word: "Russia", hint: "Largest country" },
    { word: "Spain", hint: "Flamenco" }, { word: "Greece", hint: "Olympics" },
    { word: "Thailand", hint: "Temples" }, { word: "Turkey", hint: "Istanbul" },
    { word: "Switzerland", hint: "Chocolate" }, { word: "Norway", hint: "Fjords" },
    { word: "Argentina", hint: "Tango" }, { word: "South Korea", hint: "K-pop" },
  ],
};

// ======= Lobby Management =======

interface ServerLobby extends LobbyState {
  // Server-side extra data
  word: string | null;
  hint: string | null;
  imposterIds: string[];
  votes: { [playerId: string]: string };
  playerSocketMap: { [socketId: string]: string }; // socket id -> player name
  imposterGuess: string | null; // the imposter's word guess
  imposterGuessCorrect: boolean; // whether the guess was correct
  awaitingImposterGuess: boolean; // waiting for imposter to submit guess
}

// Stores info about disconnected players so they can rejoin within a timeout
interface DisconnectedPlayer {
  name: string;
  lobbyCode: string;
  wasHost: boolean;
  isImposter: boolean;
  timeout: ReturnType<typeof setTimeout>;
}

const lobbies: Map<string, ServerLobby> = new Map();
const socketToLobby: Map<string, string> = new Map(); // socketId -> lobbyCode
const voiceRooms: Map<string, Set<string>> = new Map(); // lobbyCode -> Set<socketId>
const disconnectedPlayers: Map<string, DisconnectedPlayer> = new Map(); // "lobbyCode:playerName" -> info
const chatHistory: Map<string, Array<{ id: string; senderId: string; senderName: string; text: string; timestamp: number; type: 'player' | 'system' }>> = new Map(); // lobbyCode -> messages

const MAX_CHAT_HISTORY = 100;
let chatMsgCounter = 0;
function nextChatId(): string { return `msg_${++chatMsgCounter}_${Date.now()}`; }

const REJOIN_TIMEOUT_MS = 60_000; // 60 seconds to rejoin

function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed confusing chars I,O,0,1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure unique
  if (lobbies.has(code)) return generateLobbyCode();
  return code;
}

function getPublicLobby(lobby: ServerLobby): LobbyState {
  return {
    code: lobby.code,
    phase: lobby.phase,
    players: lobby.players,
    hostId: lobby.hostId,
    settings: lobby.settings,
    conversationRound: lobby.conversationRound,
    totalRounds: lobby.totalRounds,
  };
}

// ======= Server Setup =======

const app = express();
const httpServer = createServer(app);

// Allow Vercel production URL + localhost for dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      // Allow any .vercel.app, .devtunnels.ms, or .onrender.com domain, or explicitly listed origins
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.devtunnels.ms') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.imposter.ninja') ||
        origin === 'https://imposter.ninja'
      ) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', lobbies: lobbies.size });
});

io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  // ---- CREATE LOBBY ----
  socket.on('create-lobby', (playerName: string) => {
    // Leave existing lobby if any
    cleanupPlayer(socket.id);

    const code = generateLobbyCode();
    const player: LobbyPlayer = {
      id: socket.id,
      name: playerName,
      isHost: true,
      isReady: false,
      hasRevealedWord: false,
      hasVoted: false,
      score: 0,
    };

    const lobby: ServerLobby = {
      code,
      phase: 'waiting',
      players: [player],
      hostId: socket.id,
      settings: null,
      conversationRound: 0,
      totalRounds: 0,
      word: null,
      hint: null,
      imposterIds: [],
      votes: {},
      playerSocketMap: { [socket.id]: playerName },
      imposterGuess: null,
      imposterGuessCorrect: false,
      awaitingImposterGuess: false,
    };

    lobbies.set(code, lobby);
    socketToLobby.set(socket.id, code);
    socket.join(code);

    socket.emit('lobby-created', { code, lobby: getPublicLobby(lobby) });
    console.log(`🏠 Lobby ${code} created by ${playerName}`);
  });

  // ---- JOIN LOBBY ----
  socket.on('join-lobby', ({ code, playerName }) => {
    const upperCode = code.toUpperCase();
    const lobby = lobbies.get(upperCode);

    if (!lobby) {
      socket.emit('error', 'Lobby not found. Check the code and try again.');
      return;
    }

    // Check if this player is reconnecting (name exists but marked disconnected)
    const dcKey = `${upperCode}:${playerName.toLowerCase()}`;
    const dcInfo = disconnectedPlayers.get(dcKey);
    if (dcInfo) {
      // This is a rejoin during waiting phase — handle it via rejoin path
      return handleRejoin(socket, upperCode, playerName, dcKey, dcInfo, lobby);
    }

    if (lobby.phase !== 'waiting') {
      socket.emit('error', 'Game already in progress. Use "Rejoin" with the same name to reconnect.');
      return;
    }

    if (lobby.players.filter(p => !p.isDisconnected).length >= 12) {
      socket.emit('error', 'Lobby is full (max 12 players).');
      return;
    }

    if (lobby.players.some(p => p.name.toLowerCase() === playerName.toLowerCase() && !p.isDisconnected)) {
      socket.emit('error', 'A player with that name already exists in this lobby.');
      return;
    }

    // Leave existing lobby if any
    cleanupPlayer(socket.id);

    const player: LobbyPlayer = {
      id: socket.id,
      name: playerName,
      isHost: false,
      isReady: false,
      hasRevealedWord: false,
      hasVoted: false,
      isDisconnected: false,
      score: 0,
    };

    lobby.players.push(player);
    lobby.playerSocketMap[socket.id] = playerName;
    socketToLobby.set(socket.id, upperCode);
    socket.join(upperCode);

    socket.emit('lobby-joined', { lobby: getPublicLobby(lobby), playerId: socket.id });
    // Send chat history to the joining player
    const history = chatHistory.get(upperCode) || [];
    if (history.length > 0) socket.emit('chat-history', history);
    socket.to(upperCode).emit('player-joined', { player, lobby: getPublicLobby(lobby) });
    console.log(`➕ ${playerName} joined lobby ${upperCode}`);
  });

  // ---- REJOIN LOBBY (reconnect after accidental disconnect) ----
  socket.on('rejoin-lobby', ({ code, playerName }) => {
    const upperCode = code.toUpperCase();
    const lobby = lobbies.get(upperCode);

    if (!lobby) {
      socket.emit('error', 'Lobby no longer exists.');
      return;
    }

    const dcKey = `${upperCode}:${playerName.toLowerCase()}`;
    const dcInfo = disconnectedPlayers.get(dcKey);

    if (!dcInfo) {
      // No disconnected record — if lobby is in waiting phase, just join as a new player
      if (lobby.phase === 'waiting') {
        // Check if a disconnected slot with this name exists (timeout expired but slot still there)
        const existingSlot = lobby.players.find(
          p => p.name.toLowerCase() === playerName.toLowerCase()
        );
        if (existingSlot) {
          // Remove the stale slot and add fresh
          lobby.players = lobby.players.filter(p => p.id !== existingSlot.id);
          delete lobby.playerSocketMap[existingSlot.id];
          socketToLobby.delete(existingSlot.id);
          if (lobby.hostId === existingSlot.id) {
            // Will reassign host below
          }
        }

        // Check name uniqueness against remaining players
        const nameTaken = lobby.players.some(
          p => p.name.toLowerCase() === playerName.toLowerCase()
        );
        if (nameTaken) {
          socket.emit('error', 'That name is already taken in this lobby.');
          return;
        }

        // Check max players
        if (lobby.players.length >= 20) {
          socket.emit('error', 'Lobby is full (max 20 players).');
          return;
        }

        // Leave any existing lobby
        cleanupPlayer(socket.id);

        const isNewHost = lobby.players.length === 0;
        const player: LobbyPlayer = {
          id: socket.id,
          name: playerName,
          isHost: isNewHost,
          isReady: false,
          hasRevealedWord: false,
          hasVoted: false,
          isDisconnected: false,
          score: 0,
        };
        if (isNewHost) lobby.hostId = socket.id;

        lobby.players.push(player);
        lobby.playerSocketMap[socket.id] = playerName;
        socketToLobby.set(socket.id, upperCode);
        socket.join(upperCode);

        socket.emit('lobby-joined', { lobby: getPublicLobby(lobby), playerId: socket.id });
        const history = chatHistory.get(upperCode) || [];
        if (history.length > 0) socket.emit('chat-history', history);
        socket.to(upperCode).emit('player-joined', { player, lobby: getPublicLobby(lobby) });
        console.log(`🔄➕ ${playerName} rejoin-fallback joined lobby ${upperCode} (waiting phase)`);
        return;
      } else {
        socket.emit('error', 'Your 60-second rejoin window has expired. The game is still in progress — ask the host to start a new round.');
      }
      return;
    }

    handleRejoin(socket, upperCode, playerName, dcKey, dcInfo, lobby);
  });

  // Shared rejoin logic
  function handleRejoin(
    sock: typeof socket,
    upperCode: string,
    playerName: string,
    dcKey: string,
    dcInfo: DisconnectedPlayer,
    lobby: ServerLobby
  ) {
    // Clear the disconnect timeout
    clearTimeout(dcInfo.timeout);
    disconnectedPlayers.delete(dcKey);

    // Leave any existing lobby
    cleanupPlayer(sock.id);

    // Find the placeholder player slot and replace it with the new socket
    const existingPlayer = lobby.players.find(
      p => p.name.toLowerCase() === playerName.toLowerCase() && p.isDisconnected
    );

    if (existingPlayer) {
      // Replace old socket id with new one
      const oldId = existingPlayer.id;
      delete lobby.playerSocketMap[oldId];

      // Update vote references if they had voted (update the key)
      if (lobby.votes[oldId]) {
        lobby.votes[sock.id] = lobby.votes[oldId];
        delete lobby.votes[oldId];
      }
      // Update any votes that point TO the old id
      Object.keys(lobby.votes).forEach(voterId => {
        if (lobby.votes[voterId] === oldId) {
          lobby.votes[voterId] = sock.id;
        }
      });

      // Update imposter ids
      const impIdx = lobby.imposterIds.indexOf(oldId);
      if (impIdx !== -1) {
        lobby.imposterIds[impIdx] = sock.id;
      }

      existingPlayer.id = sock.id;
      existingPlayer.isDisconnected = false;

      // Restore host if they were host
      if (dcInfo.wasHost) {
        // Remove host from whoever currently has it and give it back
        lobby.players.forEach(p => { p.isHost = false; });
        existingPlayer.isHost = true;
        lobby.hostId = sock.id;
      }
    } else {
      // Player slot was removed (shouldn't happen but handle gracefully)
      const player: LobbyPlayer = {
        id: sock.id,
        name: playerName,
        isHost: false,
        isReady: false,
        hasRevealedWord: false,
        hasVoted: false,
        isDisconnected: false,
        score: 0,
      };
      lobby.players.push(player);
    }

    lobby.playerSocketMap[sock.id] = playerName;
    socketToLobby.set(sock.id, upperCode);
    sock.join(upperCode);

    // Send the rejoining player their full game state
    const isImposter = lobby.imposterIds.includes(sock.id);
    let playerData: PlayerGameData | null = null;
    let gameResults: GameResults | null = null;

    if (lobby.phase !== 'waiting') {
      playerData = {
        isImposter,
        word: isImposter ? null : lobby.word,
        hint: isImposter && lobby.settings?.useHintForImposter ? lobby.hint : null,
      };
    }

    if (lobby.phase === 'result' && lobby.word) {
      // Reconstruct results
      const voteCount: { [id: string]: number } = {};
      Object.values(lobby.votes).forEach(votedId => {
        voteCount[votedId] = (voteCount[votedId] || 0) + 1;
      });
      const maxVotes = Math.max(...Object.values(voteCount), 0);
      const mostVotedPlayers = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);
      const imposterCaught = mostVotedPlayers.some(id => lobby.imposterIds.includes(id));

      gameResults = {
        votes: lobby.votes,
        imposterIds: lobby.imposterIds,
        word: lobby.word,
        impostersWin: !imposterCaught,
        roundPoints: {},
        imposterGuess: lobby.imposterGuess || undefined,
        imposterGuessCorrect: lobby.imposterGuessCorrect || undefined,
      };
    }

    sock.emit('rejoined-game', {
      lobby: getPublicLobby(lobby),
      playerData,
      gameResults,
    });
    // Send chat history to the rejoining player
    const chatHist = chatHistory.get(upperCode) || [];
    if (chatHist.length > 0) sock.emit('chat-history', chatHist);

    // Notify others
    sock.to(upperCode).emit('player-reconnected', {
      playerId: sock.id,
      playerName,
      lobby: getPublicLobby(lobby),
    });

    console.log(`🔄 ${playerName} rejoined lobby ${upperCode} (phase: ${lobby.phase})`);
  }

  // ---- LEAVE LOBBY ----
  socket.on('leave-lobby', () => {
    cleanupPlayer(socket.id);
  });

  // ---- HOST: START SETTINGS ----
  socket.on('start-settings', () => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id) return;
    if (lobby.players.length < 3) {
      socket.emit('error', 'Need at least 3 players to start.');
      return;
    }

    lobby.phase = 'settings';
    io.to(lobby.code).emit('settings-phase', getPublicLobby(lobby));
  });

  // ---- HOST: START GAME ----
  socket.on('start-game', async (settings: LobbySettings) => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id) return;

    // Validate settings
    if (settings.numberOfImposters >= lobby.players.length) {
      socket.emit('error', 'Too many imposters for the number of players.');
      return;
    }

    // Determine which category to use for word generation
    const useCustom = settings.customCategory && settings.customCategory.trim().length > 0;
    const categoryForLLM = useCustom ? settings.customCategory.trim() : settings.category;
    const difficulty = settings.difficulty || 'medium';

    let wordItem: { word: string; hint: string } | null = null;

    // Try LLM generation first
    const generated = await generateWords(categoryForLLM, difficulty);
    if (generated && generated.length > 0) {
      wordItem = generated[Math.floor(Math.random() * generated.length)];
    }

    // Fallback to static database if LLM fails or no custom category
    if (!wordItem) {
      const category = settings.category;
      const words = wordDatabase[category];
      if (!words || words.length === 0) {
        socket.emit('error', 'Failed to generate words. Try a different category.');
        return;
      }
      wordItem = words[Math.floor(Math.random() * words.length)];
    }

    // Pick imposters
    const shuffledIds = lobby.players.map(p => p.id).sort(() => Math.random() - 0.5);
    const imposterIds = shuffledIds.slice(0, settings.numberOfImposters);

    // Update lobby
    lobby.settings = settings;
    lobby.phase = 'reveal';
    lobby.word = wordItem.word;
    lobby.hint = wordItem.hint;
    lobby.imposterIds = imposterIds;
    lobby.votes = {};
    lobby.conversationRound = 1;
    lobby.totalRounds = settings.numberOfConversations;
    lobby.imposterGuess = null;
    lobby.imposterGuessCorrect = false;
    lobby.awaitingImposterGuess = false;

    // Reset player states
    lobby.players.forEach(p => {
      p.hasRevealedWord = false;
      p.hasVoted = false;
    });

    // Send each player their private data
    lobby.players.forEach(player => {
      const isImposter = imposterIds.includes(player.id);
      const playerData: PlayerGameData = {
        isImposter,
        word: isImposter ? null : wordItem.word,
        hint: isImposter && settings.useHintForImposter ? wordItem.hint : null,
      };
      io.to(player.id).emit('game-started', {
        lobby: getPublicLobby(lobby),
        playerData,
      });
    });

    console.log(`🎮 Game started in lobby ${lobby.code} | Word: ${wordItem.word} | Imposters: ${imposterIds.length}`);
  });

  // ---- PLAYER: WORD REVEALED ----
  socket.on('word-revealed', () => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.phase !== 'reveal') return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (player) player.hasRevealedWord = true;

    // Check if all players have revealed
    const allRevealed = lobby.players.every(p => p.hasRevealedWord);
    if (allRevealed) {
      lobby.phase = 'conversation';
      io.to(lobby.code).emit('all-revealed', getPublicLobby(lobby));
    } else {
      // Update lobby state for everyone
      io.to(lobby.code).emit('lobby-updated', getPublicLobby(lobby));
    }
  });

  // ---- HOST: START VOTING ----
  socket.on('start-voting' as keyof ClientToServerEvents, () => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id) return;
    if (lobby.phase !== 'conversation') return;

    lobby.phase = 'voting';
    lobby.players.forEach(p => { p.hasVoted = false; });
    lobby.votes = {};

    io.to(lobby.code).emit('phase-changed', getPublicLobby(lobby));
  });

  // ---- PLAYER: CAST VOTE ----
  socket.on('cast-vote', (votedForId: string) => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.phase !== 'voting') return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player || player.hasVoted) return;

    // Can't vote for yourself
    if (votedForId === socket.id) {
      socket.emit('error', "You can't vote for yourself!");
      return;
    }

    // Can't vote for a disconnected player
    const votedForPlayer = lobby.players.find(p => p.id === votedForId);
    if (!votedForPlayer) {
      socket.emit('error', 'Invalid player selected.');
      return;
    }

    lobby.votes[socket.id] = votedForId;
    player.hasVoted = true;

    const activePlayers = lobby.players.filter(p => !p.isDisconnected);
    const votedCount = activePlayers.filter(p => p.hasVoted).length;
    io.to(lobby.code).emit('vote-update', {
      votedCount,
      totalPlayers: activePlayers.length,
    });

    // Check if all active (connected) players voted
    checkAllVoted(lobby);
  });

  // ---- IMPOSTER: GUESS THE WORD ----
  socket.on('imposter-guess', (guess: string) => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || !lobby.awaitingImposterGuess) return;
    if (!lobby.imposterIds.includes(socket.id)) return;

    const normalizedGuess = (guess || '').trim().toLowerCase();
    const normalizedWord = (lobby.word || '').trim().toLowerCase();
    const isCorrect = normalizedGuess === normalizedWord;

    lobby.imposterGuess = guess.trim();
    lobby.imposterGuessCorrect = isCorrect;
    lobby.awaitingImposterGuess = false;

    // Now finalize with imposter caught = true (since we only prompt on catch)
    finalizeResults(lobby, true);
  });

  // ---- HOST: NEW GAME ----
  socket.on('new-game', () => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id) return;

    // Remove disconnected players permanently on new game
    const dcPlayers = lobby.players.filter(p => p.isDisconnected);
    dcPlayers.forEach(p => {
      const dcKey = `${lobby.code}:${p.name.toLowerCase()}`;
      const dcInfo = disconnectedPlayers.get(dcKey);
      if (dcInfo) {
        clearTimeout(dcInfo.timeout);
        disconnectedPlayers.delete(dcKey);
      }
      delete lobby.playerSocketMap[p.id];
      socketToLobby.delete(p.id);
    });
    lobby.players = lobby.players.filter(p => !p.isDisconnected);

    if (lobby.players.length === 0) {
      lobbies.delete(lobby.code);
      chatHistory.delete(lobby.code);
      return;
    }

    lobby.phase = 'waiting';
    lobby.settings = null;
    lobby.word = null;
    lobby.hint = null;
    lobby.imposterIds = [];
    lobby.votes = {};
    lobby.conversationRound = 0;
    lobby.totalRounds = 0;
    lobby.imposterGuess = null;
    lobby.imposterGuessCorrect = false;
    lobby.awaitingImposterGuess = false;

    lobby.players.forEach(p => {
      p.hasRevealedWord = false;
      p.hasVoted = false;
      p.isDisconnected = false;
      // score is NOT reset — it persists across rounds
    });

    io.to(lobby.code).emit('lobby-updated', getPublicLobby(lobby));
  });

  // ---- HOST: KICK PLAYER ----
  socket.on('kick-player', (playerId: string) => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id) return;
    if (playerId === socket.id) return; // can't kick yourself

    const kickedPlayer = lobby.players.find(p => p.id === playerId);
    if (!kickedPlayer) return;

    lobby.players = lobby.players.filter(p => p.id !== playerId);
    delete lobby.playerSocketMap[playerId];
    socketToLobby.delete(playerId);

    const kickedSocket = io.sockets.sockets.get(playerId);
    if (kickedSocket) {
      kickedSocket.leave(lobby.code);
      kickedSocket.emit('player-kicked', { playerId });
    }

    io.to(lobby.code).emit('player-left', { playerId, lobby: getPublicLobby(lobby) });
    console.log(`🚫 ${kickedPlayer.name} kicked from lobby ${lobby.code}`);
  });

  // ======= Text Chat =======

  socket.on('send-message', (text: string) => {
    if (!text || typeof text !== 'string') return;
    const trimmed = text.trim().slice(0, 500); // max 500 chars
    if (!trimmed) return;

    const lobby = getLobbyForSocket(socket.id);
    if (!lobby) return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    const msg = {
      id: nextChatId(),
      senderId: socket.id,
      senderName: player.name,
      text: trimmed,
      timestamp: Date.now(),
      type: 'player' as const,
    };

    // Store in history
    if (!chatHistory.has(lobby.code)) chatHistory.set(lobby.code, []);
    const history = chatHistory.get(lobby.code)!;
    history.push(msg);
    if (history.length > MAX_CHAT_HISTORY) history.shift();

    // Broadcast to entire lobby
    io.to(lobby.code).emit('chat-message', msg);
  });

  // ======= WebRTC Voice Chat Signaling =======

  // Player joins voice chat in their lobby
  socket.on('voice-join' as any, (data: { lobbyCode: string }) => {
    const code = data.lobbyCode;
    if (!voiceRooms.has(code)) {
      voiceRooms.set(code, new Set());
    }
    const members = voiceRooms.get(code)!;

    // Send existing voice members to the joiner
    const existingPeers = Array.from(members).filter(id => id !== socket.id);
    socket.emit('voice-peers-list' as any, { peerIds: existingPeers });

    // Add to room and notify others
    members.add(socket.id);
    socket.to(code).emit('voice-peer-joined' as any, { peerId: socket.id });
    console.log(`🎙️ ${socket.id} joined voice in ${code} (${members.size} in voice)`);
  });

  // Player leaves voice chat
  socket.on('voice-leave' as any, (data: { lobbyCode: string }) => {
    const code = data.lobbyCode;
    const members = voiceRooms.get(code);
    if (members) {
      members.delete(socket.id);
      socket.to(code).emit('voice-peer-left' as any, { peerId: socket.id });
      if (members.size === 0) voiceRooms.delete(code);
      console.log(`🔇 ${socket.id} left voice in ${code}`);
    }
  });

  // Relay WebRTC offer
  socket.on('webrtc-offer' as any, (data: { targetId: string; offer: RTCSessionDescriptionInit }) => {
    const target = io.sockets.sockets.get(data.targetId);
    if (target) {
      target.emit('webrtc-offer' as any, { fromId: socket.id, offer: data.offer });
    }
  });

  // Relay WebRTC answer
  socket.on('webrtc-answer' as any, (data: { targetId: string; answer: RTCSessionDescriptionInit }) => {
    const target = io.sockets.sockets.get(data.targetId);
    if (target) {
      target.emit('webrtc-answer' as any, { fromId: socket.id, answer: data.answer });
    }
  });

  // Relay ICE candidates
  socket.on('webrtc-ice-candidate' as any, (data: { targetId: string; candidate: unknown }) => {
    const target = io.sockets.sockets.get(data.targetId);
    if (target) {
      target.emit('webrtc-ice-candidate' as any, { fromId: socket.id, candidate: data.candidate });
    }
  });

  // ---- DISCONNECT ----
  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);

    // Remove from voice rooms
    voiceRooms.forEach((members, code) => {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        socket.to(code).emit('voice-peer-left' as any, { peerId: socket.id });
        if (members.size === 0) voiceRooms.delete(code);
      }
    });

    // Handle lobby disconnect with rejoin support
    handlePlayerDisconnect(socket.id);
  });

  // ======= Helper Functions =======

  function getLobbyForSocket(socketId: string): ServerLobby | null {
    const code = socketToLobby.get(socketId);
    if (!code) return null;
    return lobbies.get(code) || null;
  }

  // Called on socket disconnect — marks player as disconnected with a rejoin timeout
  function handlePlayerDisconnect(socketId: string) {
    const code = socketToLobby.get(socketId);
    if (!code) return;

    const lobby = lobbies.get(code);
    if (!lobby) {
      socketToLobby.delete(socketId);
      return;
    }

    const leavingPlayer = lobby.players.find(p => p.id === socketId);
    if (!leavingPlayer) {
      socketToLobby.delete(socketId);
      return;
    }

    // Keep player slot for rejoin in ALL phases (including waiting)
    leavingPlayer.isDisconnected = true;
    socketToLobby.delete(socketId);

    const pSocket = io.sockets.sockets.get(socketId);
    if (pSocket) pSocket.leave(code);

    const dcKey = `${code}:${leavingPlayer.name.toLowerCase()}`;

    // If host disconnected, assign temporary host to someone still connected
    let hostChanged = false;
    if (lobby.hostId === socketId) {
      const connectedPlayer = lobby.players.find(p => !p.isDisconnected && p.id !== socketId);
      if (connectedPlayer) {
        leavingPlayer.isHost = false;
        connectedPlayer.isHost = true;
        lobby.hostId = connectedPlayer.id;
        hostChanged = true;
        console.log(`👑 Temporary host in ${code}: ${connectedPlayer.name} (${leavingPlayer.name} disconnected)`);
      }
    }

    // Set a timeout to permanently remove them if they don't rejoin
    const timeout = setTimeout(() => {
      disconnectedPlayers.delete(dcKey);
      permanentlyRemovePlayer(code, leavingPlayer.name);
    }, REJOIN_TIMEOUT_MS);

    disconnectedPlayers.set(dcKey, {
      name: leavingPlayer.name,
      lobbyCode: code,
      wasHost: lobby.hostId === socketId || (hostChanged && true),
      isImposter: lobby.imposterIds.includes(socketId),
      timeout,
    });

    // Notify remaining players
    io.to(code).emit('player-disconnected', {
      playerId: socketId,
      playerName: leavingPlayer.name,
      lobby: getPublicLobby(lobby),
    });

    if (hostChanged) {
      const newHost = lobby.players.find(p => p.id === lobby.hostId);
      io.to(code).emit('host-changed', {
        newHostId: lobby.hostId,
        newHostName: newHost?.name || 'Unknown',
        lobby: getPublicLobby(lobby),
      });
    }

    // If voting phase and this player hasn't voted, check if all remaining active players voted
    if (lobby.phase === 'voting') {
      checkAllVoted(lobby);
    }

    console.log(`⏸️ ${leavingPlayer.name} disconnected from lobby ${code} — has ${REJOIN_TIMEOUT_MS / 1000}s to rejoin`);
  }

  // Called on intentional leave (leave-lobby event) — always removes immediately
  function cleanupPlayer(socketId: string) {
    const code = socketToLobby.get(socketId);
    if (!code) return;

    const lobby = lobbies.get(code);
    if (!lobby) {
      socketToLobby.delete(socketId);
      return;
    }

    const leavingPlayer = lobby.players.find(p => p.id === socketId);

    // Also clear any disconnect timer for this player
    if (leavingPlayer) {
      const dcKey = `${code}:${leavingPlayer.name.toLowerCase()}`;
      const dcInfo = disconnectedPlayers.get(dcKey);
      if (dcInfo) {
        clearTimeout(dcInfo.timeout);
        disconnectedPlayers.delete(dcKey);
      }
    }

    lobby.players = lobby.players.filter(p => p.id !== socketId);
    delete lobby.playerSocketMap[socketId];
    socketToLobby.delete(socketId);

    const pSocket = io.sockets.sockets.get(socketId);
    if (pSocket) pSocket.leave(code);

    if (lobby.players.length === 0) {
      lobbies.delete(code);
      chatHistory.delete(code);
      console.log(`\ud83d\uddd1\ufe0f Lobby ${code} deleted (empty)`);
      return;
    }
    if (lobby.hostId === socketId) {
      const connectedPlayer = lobby.players.find(p => !p.isDisconnected);
      const newHost = connectedPlayer || lobby.players[0];
      lobby.players.forEach(p => { p.isHost = false; });
      newHost.isHost = true;
      lobby.hostId = newHost.id;

      io.to(code).emit('host-changed', {
        newHostId: newHost.id,
        newHostName: newHost.name,
        lobby: getPublicLobby(lobby),
      });
      console.log(`👑 New host in ${code}: ${newHost.name}`);
    }

    io.to(code).emit('player-left', { playerId: socketId, lobby: getPublicLobby(lobby) });
    if (leavingPlayer) {
      console.log(`🚪 ${leavingPlayer.name} left lobby ${code}`);
    }
  }

  // Permanently remove a player who didn't rejoin within the timeout
  function permanentlyRemovePlayer(code: string, playerName: string) {
    const lobby = lobbies.get(code);
    if (!lobby) return;

    const player = lobby.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!player) return;

    const playerId = player.id;
    lobby.players = lobby.players.filter(p => p.id !== playerId);
    delete lobby.playerSocketMap[playerId];
    socketToLobby.delete(playerId);

    if (lobby.players.length === 0) {
      lobbies.delete(code);
      chatHistory.delete(code);
      console.log(`🗑️ Lobby ${code} deleted (empty after timeout)`);
      return;
    }

    // If this was the host, reassign
    if (lobby.hostId === playerId) {
      const connectedPlayer = lobby.players.find(p => !p.isDisconnected);
      const newHost = connectedPlayer || lobby.players[0];
      lobby.players.forEach(p => { p.isHost = false; });
      newHost.isHost = true;
      lobby.hostId = newHost.id;

      io.to(code).emit('host-changed', {
        newHostId: newHost.id,
        newHostName: newHost.name,
        lobby: getPublicLobby(lobby),
      });
    }

    io.to(code).emit('player-left', { playerId, lobby: getPublicLobby(lobby) });

    // If voting phase, recheck if all active players have voted
    if (lobby.phase === 'voting') {
      checkAllVoted(lobby);
    }

    console.log(`⏰ ${playerName} permanently removed from ${code} (rejoin timeout expired)`);
  }

  // Check if all connected (non-disconnected) players have voted
  function checkAllVoted(lobby: ServerLobby) {
    const activePlayers = lobby.players.filter(p => !p.isDisconnected);
    const allVoted = activePlayers.every(p => p.hasVoted);

    if (allVoted && activePlayers.length > 0) {
      const voteCount: { [id: string]: number } = {};
      Object.values(lobby.votes).forEach(votedId => {
        voteCount[votedId] = (voteCount[votedId] || 0) + 1;
      });

      const maxVotes = Math.max(...Object.values(voteCount), 0);
      const mostVotedPlayers = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);
      const imposterCaught = mostVotedPlayers.some(id => lobby.imposterIds.includes(id));

      if (imposterCaught) {
        // Imposter was caught — give them a chance to guess the word
        lobby.awaitingImposterGuess = true;
        // Prompt each imposter to guess
        lobby.imposterIds.forEach(id => {
          io.to(id).emit('imposter-guess-prompt');
        });
      } else {
        // Imposters win — finalize immediately
        finalizeResults(lobby, imposterCaught);
      }
    }
  }

  // Finalize the round results and award points
  function finalizeResults(lobby: ServerLobby, imposterCaught: boolean) {
    lobby.phase = 'result';
    const roundPoints: { [playerId: string]: number } = {};

    // Initialize all players with 0 points for this round
    lobby.players.forEach(p => { roundPoints[p.id] = 0; });

    // Innocent players who correctly voted for an imposter get +10
    Object.entries(lobby.votes).forEach(([voterId, votedForId]) => {
      if (!lobby.imposterIds.includes(voterId) && lobby.imposterIds.includes(votedForId)) {
        roundPoints[voterId] = (roundPoints[voterId] || 0) + 10;
      }
    });

    // Imposters who survived (not caught) get +15
    if (!imposterCaught) {
      lobby.imposterIds.forEach(id => {
        roundPoints[id] = (roundPoints[id] || 0) + 15;
      });
    }

    // Imposter correct word guess: +20
    if (lobby.imposterGuessCorrect) {
      lobby.imposterIds.forEach(id => {
        roundPoints[id] = (roundPoints[id] || 0) + 20;
      });
    }

    // Apply round points to cumulative scores
    lobby.players.forEach(p => {
      p.score = (p.score || 0) + (roundPoints[p.id] || 0);
    });

    const results: GameResults = {
      votes: lobby.votes,
      imposterIds: lobby.imposterIds,
      word: lobby.word!,
      impostersWin: !imposterCaught,
      roundPoints,
      imposterGuess: lobby.imposterGuess || undefined,
      imposterGuessCorrect: lobby.imposterGuessCorrect || undefined,
    };

    io.to(lobby.code).emit('game-results', results);
    io.to(lobby.code).emit('phase-changed', getPublicLobby(lobby));
  }
});

// ======= Start Server =======
// Render/Railway/Fly set PORT automatically; fall back to SOCKET_PORT or 3001 for local dev
const PORT = parseInt(process.env.PORT || process.env.SOCKET_PORT || '3001', 10);

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Imposter Game Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
