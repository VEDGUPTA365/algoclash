import dotenv from 'dotenv';
dotenv.config(); // MUST be first before any other imports

import express    from 'express';
import http        from 'http';
import { Server }  from 'socket.io';
import cors        from 'cors';

import authRoutes       from './routes/authRoutes.js';
import problemRoutes    from './routes/problemRoutes.js';
import duelRoutes       from './routes/duelRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import markRoutes       from './routes/markRoutes.js';
import aiRoutes         from './routes/aiRoutes.js';

import { registerDuelSocket }       from './socket/duelSocket.js';
import { registerRandomDuelSocket } from './socket/randomDuelSocket.js';

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:  process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

registerDuelSocket(io);
registerRandomDuelSocket(io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth',        authRoutes);
app.use('/api/problems',    problemRoutes);
app.use('/api/duels',       duelRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/marks',       markRoutes);
app.use('/api/ai',          aiRoutes);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', project: 'AlgoClash', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ⚔️  AlgoClash Backend Running
  ─────────────────────────────
  🌐  API    → http://localhost:${PORT}/api
  🔌  Socket → ws://localhost:${PORT}
  `);
});