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
}

const lobbies: Map<string, ServerLobby> = new Map();
const socketToLobby: Map<string, string> = new Map(); // socketId -> lobbyCode
const voiceRooms: Map<string, Set<string>> = new Map(); // lobbyCode -> Set<socketId>

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
      // Allow any .vercel.app domain or explicitly listed origins
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
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

    if (lobby.phase !== 'waiting') {
      socket.emit('error', 'Game already in progress. Cannot join now.');
      return;
    }

    if (lobby.players.length >= 12) {
      socket.emit('error', 'Lobby is full (max 12 players).');
      return;
    }

    if (lobby.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
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
    };

    lobby.players.push(player);
    lobby.playerSocketMap[socket.id] = playerName;
    socketToLobby.set(socket.id, upperCode);
    socket.join(upperCode);

    socket.emit('lobby-joined', { lobby: getPublicLobby(lobby), playerId: socket.id });
    socket.to(upperCode).emit('player-joined', { player, lobby: getPublicLobby(lobby) });
    console.log(`➕ ${playerName} joined lobby ${upperCode}`);
  });

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
  socket.on('start-game', (settings: LobbySettings) => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id) return;

    // Validate settings
    if (settings.numberOfImposters >= lobby.players.length) {
      socket.emit('error', 'Too many imposters for the number of players.');
      return;
    }

    // Pick word
    const category = settings.category;
    const words = wordDatabase[category];
    if (!words || words.length === 0) {
      socket.emit('error', 'Invalid category selected.');
      return;
    }
    const wordItem = words[Math.floor(Math.random() * words.length)];

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

    lobby.votes[socket.id] = votedForId;
    player.hasVoted = true;

    const votedCount = Object.keys(lobby.votes).length;
    io.to(lobby.code).emit('vote-update', {
      votedCount,
      totalPlayers: lobby.players.length,
    });

    // Check if all players voted
    if (votedCount === lobby.players.length) {
      // Calculate results
      lobby.phase = 'result';

      // Count votes per player
      const voteCount: { [id: string]: number } = {};
      Object.values(lobby.votes).forEach(votedId => {
        voteCount[votedId] = (voteCount[votedId] || 0) + 1;
      });

      // Find most voted player(s)
      const maxVotes = Math.max(...Object.values(voteCount), 0);
      const mostVotedPlayers = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);

      // Imposters win if no imposter was in the most voted
      const imposterCaught = mostVotedPlayers.some(id => lobby.imposterIds.includes(id));
      const impostersWin = !imposterCaught;

      const results: GameResults = {
        votes: lobby.votes,
        imposterIds: lobby.imposterIds,
        word: lobby.word!,
        impostersWin,
      };

      io.to(lobby.code).emit('game-results', results);
      io.to(lobby.code).emit('phase-changed', getPublicLobby(lobby));
    }
  });

  // ---- HOST: NEW GAME ----
  socket.on('new-game', () => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.hostId !== socket.id) return;

    lobby.phase = 'waiting';
    lobby.settings = null;
    lobby.word = null;
    lobby.hint = null;
    lobby.imposterIds = [];
    lobby.votes = {};
    lobby.conversationRound = 0;
    lobby.totalRounds = 0;

    lobby.players.forEach(p => {
      p.hasRevealedWord = false;
      p.hasVoted = false;
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
    cleanupPlayer(socket.id);
  });

  // ======= Helper Functions =======

  function getLobbyForSocket(socketId: string): ServerLobby | null {
    const code = socketToLobby.get(socketId);
    if (!code) return null;
    return lobbies.get(code) || null;
  }

  function cleanupPlayer(socketId: string) {
    const code = socketToLobby.get(socketId);
    if (!code) return;

    const lobby = lobbies.get(code);
    if (!lobby) {
      socketToLobby.delete(socketId);
      return;
    }

    const leavingPlayer = lobby.players.find(p => p.id === socketId);
    lobby.players = lobby.players.filter(p => p.id !== socketId);
    delete lobby.playerSocketMap[socketId];
    socketToLobby.delete(socketId);

    const pSocket = io.sockets.sockets.get(socketId);
    if (pSocket) pSocket.leave(code);

    if (lobby.players.length === 0) {
      // Delete empty lobby
      lobbies.delete(code);
      console.log(`🗑️ Lobby ${code} deleted (empty)`);
      return;
    }

    // If host left, assign new host
    if (lobby.hostId === socketId) {
      const newHost = lobby.players[0];
      lobby.hostId = newHost.id;
      newHost.isHost = true;
      console.log(`👑 New host in ${code}: ${newHost.name}`);
    }

    io.to(code).emit('player-left', { playerId: socketId, lobby: getPublicLobby(lobby) });
    if (leavingPlayer) {
      console.log(`🚪 ${leavingPlayer.name} left lobby ${code}`);
    }
  }
});

// ======= Start Server =======
// Render/Railway/Fly set PORT automatically; fall back to SOCKET_PORT or 3001 for local dev
const PORT = parseInt(process.env.PORT || process.env.SOCKET_PORT || '3001', 10);

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Imposter Game Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
