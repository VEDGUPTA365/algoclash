import pool from '../config/db.js';
import { runCodeAgainstTests } from '../judge/judgeHandler.js';

// Track active rooms in memory: roomCode → { player1: socketId, player2: socketId }
const activeRooms = new Map();

export const registerDuelSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── JOIN ROOM ──────────────────────────────────────────────────────────
    socket.on('join_room', async ({ roomCode, userId, username }) => {
      socket.join(roomCode);

      if (!activeRooms.has(roomCode)) {
        activeRooms.set(roomCode, {});
      }

      const room = activeRooms.get(roomCode);
      room[socket.id] = { userId, username, testsPasssed: 0, testsTotal: 0 };

      console.log(`👤 ${username} joined room ${roomCode}`);

      // Notify everyone in the room
      io.to(roomCode).emit('player_joined', {
        socketId: socket.id,
        username,
        userId,
        playerCount: Object.keys(room).length,
      });

      // If 2 players are in, start the duel
      if (Object.keys(room).length === 2) {
        try {
          const duelResult = await pool.query(
            `SELECT d.*, p.title, p.description, p.difficulty
             FROM duels d
             LEFT JOIN problems p ON p.id = d.problem_id
             WHERE d.room_code = $1`,
            [roomCode]
          );

          if (duelResult.rows.length > 0) {
            const duel = duelResult.rows[0];

            // Get sample test cases for display
            const sampleTests = await pool.query(
              `SELECT input, expected_output FROM test_cases
               WHERE problem_id = $1 AND is_sample = TRUE`,
              [duel.problem_id]
            );

            io.to(roomCode).emit('duel_start', {
              problem: {
                id:          duel.problem_id,
                title:       duel.title,
                description: duel.description,
                difficulty:  duel.difficulty,
                sampleTests: sampleTests.rows,
              },
              players: Object.values(room).map((p) => ({
                username: p.username,
                userId:   p.userId,
              })),
            });
          }
        } catch (err) {
          console.error('duel_start error:', err.message);
        }
      }
    });

    // ── SUBMIT CODE ────────────────────────────────────────────────────────
    socket.on('submit_code', async ({ roomCode, userId, username, code, language }) => {
      try {
        const duelResult = await pool.query(
          'SELECT * FROM duels WHERE room_code = $1',
          [roomCode]
        );

        if (duelResult.rows.length === 0) return;

        const duel = duelResult.rows[0];

        if (duel.status !== 'active') {
          socket.emit('submission_result', {
            error: 'Duel is not active anymore.',
          });
          return;
        }

        // Get ALL test cases
        const testCases = await pool.query(
          'SELECT input, expected_output FROM test_cases WHERE problem_id = $1',
          [duel.problem_id]
        );

        // Notify opponent that this player is submitting
        socket.to(roomCode).emit('opponent_submitting', { username });

        const { passed, total, results } = await runCodeAgainstTests(
          code, language, testCases.rows
        );

        const status = passed === total ? 'accepted' : 'wrong_answer';

        // Save submission to DB
        await pool.query(
          `INSERT INTO submissions
             (user_id, problem_id, duel_id, language, code, status, tests_passed, tests_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, duel.problem_id, duel.id, language, code, status, passed, total]
        );

        // Update room memory
        const room = activeRooms.get(roomCode);
        if (room && room[socket.id]) {
          room[socket.id].testsPassed = passed;
          room[socket.id].testsTotal  = total;
        }

        // Send result back to submitter
        socket.emit('submission_result', { passed, total, status, results });

        // Broadcast progress to opponent
        socket.to(roomCode).emit('opponent_progress', {
          username,
          passed,
          total,
          status,
        });

        // ── WINNER LOGIC ────────────────────────────────────────────────────
        if (passed === total && duel.winner_id === null) {
          // Update DB
          await pool.query(
            `UPDATE duels
             SET winner_id = $1, status = 'finished', finished_at = NOW()
             WHERE id = $2 AND winner_id IS NULL`,
            [userId, duel.id]
          );

          // Get both players ratings
          const loserId = duel.player1_id === userId
            ? duel.player2_id
            : duel.player1_id;

          const winner = await pool.query('SELECT rating FROM users WHERE id = $1', [userId]);
          const loser  = await pool.query('SELECT rating FROM users WHERE id = $1', [loserId]);

          const winnerRating = winner.rows[0]?.rating ?? 800;
          const loserRating  = loser.rows[0]?.rating  ?? 800;

          // Calculate ELO
          const { calculateElo } = await import('../utils/eloCalculator.js');
          const elo = calculateElo(winnerRating, loserRating, 1);

          // Update ratings in DB
          await pool.query('UPDATE users SET rating = $1 WHERE id = $2', [elo.newRatingA, userId]);
          await pool.query('UPDATE users SET rating = $1 WHERE id = $2', [elo.newRatingB, loserId]);

          // Save rating changes to duel
          const isPlayer1Winner = duel.player1_id === userId;
          await pool.query(
            `UPDATE duels SET
               player1_rating_change = $1,
               player2_rating_change = $2
             WHERE id = $3`,
            [
              isPlayer1Winner ? elo.changeA : elo.changeB,
              isPlayer1Winner ? elo.changeB : elo.changeA,
              duel.id,
            ]
          );

          // Update user_problem_status for winner
          await pool.query(
            `INSERT INTO user_problem_status (user_id, problem_id, status, solved_at)
             VALUES ($1, $2, 'solved', NOW())
             ON CONFLICT (user_id, problem_id) 
             DO UPDATE SET status = 'solved', solved_at = COALESCE(user_problem_status.solved_at, NOW())`,
            [userId, duel.problem_id]
          );

          console.log(`🏆 ${username} won! Rating: ${winnerRating} → ${elo.newRatingA} (${elo.changeA > 0 ? '+' : ''}${elo.changeA})`);

          // Broadcast winner + rating changes
          io.to(roomCode).emit('duel_over', {
            winnerId:           userId,
            winnerUsername:     username,
            winnerRatingChange: elo.changeA,
            loserRatingChange:  elo.changeB,
          });
        } else if (passed === total) {
           // update user_problem_status for loser solving it after duel ended
           await pool.query(
            `INSERT INTO user_problem_status (user_id, problem_id, status, solved_at)
             VALUES ($1, $2, 'solved', NOW())
             ON CONFLICT (user_id, problem_id) 
             DO UPDATE SET status = 'solved', solved_at = COALESCE(user_problem_status.solved_at, NOW())`,
            [userId, duel.problem_id]
          );
        } else {
           // attempt
           await pool.query(
            `INSERT INTO user_problem_status (user_id, problem_id, status)
             VALUES ($1, $2, 'attempted')
             ON CONFLICT (user_id, problem_id) 
             DO UPDATE SET status = CASE WHEN user_problem_status.status = 'solved' THEN 'solved' ELSE 'attempted' END`,
            [userId, duel.problem_id]
          );
        }
      } catch (err) {
        console.error('submit_code socket error:', err.message);
        socket.emit('submission_result', {
          error: err.message || 'Execution failed.',
        });
      }
    });

    // ── RUN CODE (test run, no judge) ──────────────────────────────────────
    socket.on('run_code', async ({ roomCode, code, language, input }) => {
      try {
        const { runCodeAgainstTests } = await import('../judge/judgeHandler.js');
        const testCases = [{ input: input || '', expected_output: '' }];
        const result    = await runCodeAgainstTests(code, language, testCases);
        socket.emit('run_result', result.results[0]);
      } catch (err) {
        socket.emit('run_result', { error: err.message });
      }
    });

    // ── DISCONNECT ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      // Find and clean up room
      for (const [roomCode, room] of activeRooms.entries()) {
        if (room[socket.id]) {
          const { username } = room[socket.id];
          delete room[socket.id];

          // Notify remaining player
          io.to(roomCode).emit('player_left', { username });

          // Clean up empty rooms
          if (Object.keys(room).length === 0) {
            activeRooms.delete(roomCode);
          }
          break;
        }
      }
    });
  });
};
