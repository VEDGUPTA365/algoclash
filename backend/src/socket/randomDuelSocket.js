import pool from '../config/db.js';

const waitingQueue = [];

export const registerRandomDuelSocket = (io) => {
  io.on('connection', (socket) => {
    
    socket.on('join_random_queue', async ({ userId, username }) => {
      // Get user rating
      let rating = 800;
      try {
        const u = await pool.query('SELECT rating FROM users WHERE id = $1', [userId]);
        if (u.rows.length > 0) rating = u.rows[0].rating;
      } catch (err) {}

      // Check if already in queue
      const existing = waitingQueue.findIndex(p => p.userId === userId);
      if (existing !== -1) {
        waitingQueue[existing].socketId = socket.id;
      } else {
        waitingQueue.push({ socketId: socket.id, userId, username, rating });
      }

      // Try to match
      if (waitingQueue.length >= 2) {
        // Find best match (simplest approach: just pop 2)
        const p1 = waitingQueue.shift();
        const p2 = waitingQueue.shift();

        // Create room
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Find a random problem
        const avgRating = (p1.rating + p2.rating) / 2;
        let diff = 'Easy';
        if (avgRating > 1500) diff = 'Hard';
        else if (avgRating > 1000) diff = 'Medium';

        try {
          const probs = await pool.query(
            `SELECT id FROM problems WHERE is_public = TRUE AND difficulty = $1 ORDER BY RANDOM() LIMIT 1`,
            [diff]
          );

          if (probs.rows.length === 0) {
            // fallback
            const fallback = await pool.query(`SELECT id FROM problems WHERE is_public = TRUE ORDER BY RANDOM() LIMIT 1`);
            if (fallback.rows.length > 0) probs.rows = fallback.rows;
          }

          if (probs.rows.length > 0) {
            const probId = probs.rows[0].id;

            // Create duel
            await pool.query(
              `INSERT INTO duels (room_code, problem_id, player1_id, player2_id, status)
               VALUES ($1, $2, $3, $4, 'active')`,
              [roomCode, probId, p1.userId, p2.userId]
            );

            // Notify both players
            io.to(p1.socketId).emit('random_match_found', { roomCode });
            io.to(p2.socketId).emit('random_match_found', { roomCode });
          } else {
            // No problems available
            io.to(p1.socketId).emit('random_match_failed', { message: 'No problems available' });
            io.to(p2.socketId).emit('random_match_failed', { message: 'No problems available' });
          }
        } catch (err) {
          console.error(err);
        }
      }
    });

    socket.on('leave_random_queue', ({ userId }) => {
      const idx = waitingQueue.findIndex(p => p.userId === userId);
      if (idx !== -1) waitingQueue.splice(idx, 1);
    });

    socket.on('disconnect', () => {
      const idx = waitingQueue.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) waitingQueue.splice(idx, 1);
    });

  });
};
