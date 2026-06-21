import pool from '../config/db.js';
import { runCodeAgainstTests } from '../judge/judgeHandler.js';

// ─── GENERATE ROOM CODE ──────────────────────────────────────────────────────
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ─── CREATE DUEL ROOM ────────────────────────────────────────────────────────
export const createDuel = async (req, res) => {
  const { problemId } = req.body;

  if (!problemId) {
    return res.status(400).json({ message: 'Problem ID is required.' });
  }

  try {
    // Check problem exists
    const problem = await pool.query('SELECT id FROM problems WHERE id = $1', [problemId]);
    if (problem.rows.length === 0) {
      return res.status(404).json({ message: 'Problem not found.' });
    }

    const roomCode = generateRoomCode();

    const result = await pool.query(
      `INSERT INTO duels (room_code, problem_id, player1_id, status)
       VALUES ($1, $2, $3, 'waiting') RETURNING *`,
      [roomCode, problemId, req.user.id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createDuel error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── JOIN DUEL ROOM ───────────────────────────────────────────────────────────
export const joinDuel = async (req, res) => {
  const { roomCode } = req.params;

  try {
    const duel = await pool.query(
      'SELECT * FROM duels WHERE room_code = $1',
      [roomCode]
    );

    if (duel.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const room = duel.rows[0];

    if (room.status !== 'waiting') {
      return res.status(400).json({ message: 'Room is already full or finished.' });
    }

    if (room.player1_id === req.user.id) {
      return res.status(400).json({ message: 'You created this room. Share the code!' });
    }

    const updated = await pool.query(
      `UPDATE duels SET player2_id = $1, status = 'active'
       WHERE room_code = $2 RETURNING *`,
      [req.user.id, roomCode]
    );

    return res.status(200).json(updated.rows[0]);
  } catch (err) {
    console.error('joinDuel error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET DUEL BY ROOM CODE ────────────────────────────────────────────────────
export const getDuelByRoom = async (req, res) => {
  const { roomCode } = req.params;

  try {
    const result = await pool.query(
      `SELECT d.*, p.title AS problem_title, p.description AS problem_description,
              p.difficulty,
              u1.username AS player1_name,
              u2.username AS player2_name,
              w.username  AS winner_name
       FROM duels d
       LEFT JOIN problems p  ON p.id = d.problem_id
       LEFT JOIN users u1    ON u1.id = d.player1_id
       LEFT JOIN users u2    ON u2.id = d.player2_id
       LEFT JOIN users w     ON w.id  = d.winner_id
       WHERE d.room_code = $1`,
      [roomCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Duel not found.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('getDuelByRoom error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── SUBMIT CODE IN A DUEL ────────────────────────────────────────────────────
export const submitDuelCode = async (req, res) => {
  const { roomCode } = req.params;
  const { code, language } = req.body;

  try {
    const duelResult = await pool.query(
      'SELECT * FROM duels WHERE room_code = $1',
      [roomCode]
    );

    if (duelResult.rows.length === 0) {
      return res.status(404).json({ message: 'Duel not found.' });
    }

    const duel = duelResult.rows[0];

    if (duel.status !== 'active') {
      return res.status(400).json({ message: 'Duel is not active.' });
    }

    // Get ALL test cases for judging
    const testCases = await pool.query(
      'SELECT input, expected_output FROM test_cases WHERE problem_id = $1',
      [duel.problem_id]
    );

    const { passed, total, results } = await runCodeAgainstTests(
      code, language, testCases.rows
    );

    const status = passed === total ? 'accepted' : 'wrong_answer';

    // Save submission
    await pool.query(
      `INSERT INTO submissions (user_id, problem_id, duel_id, language, code, status, tests_passed, tests_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.user.id, duel.problem_id, duel.id, language, code, status, passed, total]
    );

    // If all tests passed, update duel winner
    if (passed === total && duel.winner_id === null) {
      await pool.query(
        `UPDATE duels SET winner_id = $1, status = 'finished', finished_at = NOW()
         WHERE id = $2`,
        [req.user.id, duel.id]
      );
    }

    return res.status(200).json({ passed, total, status, results });
  } catch (err) {
    console.error('submitDuelCode error:', err.message);
    return res.status(500).json({ message: 'Server error during submission.' });
  }
};

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
export const getLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leaderboard LIMIT 50'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('getLeaderboard error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};
