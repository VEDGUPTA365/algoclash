import pool from '../config/db.js';

// ─── CREATE TOURNAMENT ────────────────────────────────────────────────────────
export const createTournament = async (req, res) => {
  const { name, duration, joinCode, problems } = req.body;
  
  if (!name || !duration || !joinCode || !problems || problems.length === 0) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO tournaments (name, duration, join_code, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, duration, joinCode, req.user.id]
    );

    const tournament = result.rows[0];

    for (const problem of problems) {
      await client.query(
        `INSERT INTO tournament_problems (tournament_id, problem_id, points)
         VALUES ($1, $2, $3)`,
        [tournament.id, problem.id, problem.points || 100]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json(tournament);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createTournament error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Join code already exists.' });
    }
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ─── GET TOURNAMENTS ──────────────────────────────────────────────────────────
export const getTournaments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tournaments ORDER BY created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('getTournaments error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── JOIN TOURNAMENT ──────────────────────────────────────────────────────────
export const joinTournament = async (req, res) => {
  const { joinCode } = req.body;

  try {
    const tournament = await pool.query(
      `SELECT * FROM tournaments WHERE join_code = $1`,
      [joinCode]
    );

    if (tournament.rows.length === 0) {
      return res.status(404).json({ message: 'Tournament not found with this code.' });
    }

    const t = tournament.rows[0];
    if (t.status === 'finished') {
      return res.status(400).json({ message: 'Tournament has already finished.' });
    }

    // Add user to tournament_players
    await pool.query(
      `INSERT INTO tournament_players (tournament_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [t.id, req.user.id]
    );

    return res.status(200).json(t);
  } catch (err) {
    console.error('joinTournament error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET TOURNAMENT DETAILS ───────────────────────────────────────────────────
export const getTournamentDetails = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    const tournamentRes = await pool.query(`SELECT * FROM tournaments WHERE id = $1`, [id]);
    if (tournamentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Tournament not found.' });
    }
    const tournament = tournamentRes.rows[0];

    // Check if user has joined
    if (!isAdmin) {
      const playerCheck = await pool.query(
        `SELECT * FROM tournament_players WHERE tournament_id = $1 AND user_id = $2`,
        [id, userId]
      );
      if (playerCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You have not joined this tournament.' });
      }
    }

    let problems = [];
    if (tournament.status !== 'waiting' || isAdmin) {
      const probRes = await pool.query(
        `SELECT p.id, p.title, p.description, p.difficulty, p.tags, tp.points
         FROM tournament_problems tp
         JOIN problems p ON p.id = tp.problem_id
         WHERE tp.tournament_id = $1
         ORDER BY tp.points ASC, p.id ASC`,
        [id]
      );
      problems = probRes.rows;
    }

    return res.status(200).json({ ...tournament, problems });
  } catch (err) {
    console.error('getTournamentDetails error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── START TOURNAMENT ─────────────────────────────────────────────────────────
export const startTournament = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE tournaments SET status = 'active', start_time = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('startTournament error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── END TOURNAMENT ───────────────────────────────────────────────────────────
export const endTournament = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE tournaments SET status = 'finished' WHERE id = $1 RETURNING *`,
      [id]
    );
    
    // Distribute points based on rank
    const leaderboard = await client.query(
      `SELECT user_id, score FROM tournament_players
       WHERE tournament_id = $1
       ORDER BY score DESC`,
      [id]
    );

    let rank = 1;
    for (let i = 0; i < leaderboard.rows.length; i++) {
      const player = leaderboard.rows[i];
      if (i > 0 && player.score < leaderboard.rows[i-1].score) {
        rank = i + 1;
      }
      
      let reward = 5; // base participation
      if (rank === 1) reward = 50;
      else if (rank === 2) reward = 30;
      else if (rank === 3) reward = 20;

      if (player.score === 0) reward = 0; // No participation points if 0 score

      await client.query(
        `UPDATE tournament_players SET rank = $1 WHERE tournament_id = $2 AND user_id = $3`,
        [rank, id, player.user_id]
      );

      if (reward > 0) {
        await client.query(
          `UPDATE users SET tournament_points = tournament_points + $1 WHERE id = $2`,
          [reward, player.user_id]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('endTournament error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ─── SUBMIT IN TOURNAMENT ─────────────────────────────────────────────────────
// Note: This endpoint should evaluate the code. To avoid duplicating judge logic,
// we will reuse runCodeAgainstTests.
import { runCodeAgainstTests } from '../judge/judgeHandler.js';

export const submitTournamentCode = async (req, res) => {
  const { id } = req.params;
  const { problemId, code, language } = req.body;
  const userId = req.user.id;

  try {
    const tournamentRes = await pool.query(`SELECT status FROM tournaments WHERE id = $1`, [id]);
    if (tournamentRes.rows.length === 0 || tournamentRes.rows[0].status !== 'active') {
      return res.status(400).json({ message: 'Tournament is not active.' });
    }

    // Check if problem already solved by this user in this tournament
    const prevSub = await pool.query(
      `SELECT * FROM tournament_submissions 
       WHERE tournament_id = $1 AND user_id = $2 AND problem_id = $3 AND status = 'accepted'`,
      [id, userId, problemId]
    );
    if (prevSub.rows.length > 0) {
      return res.status(400).json({ message: 'You have already solved this problem.' });
    }

    const testCases = await pool.query(
      'SELECT input, expected_output FROM test_cases WHERE problem_id = $1',
      [problemId]
    );

    const { passed, total, results } = await runCodeAgainstTests(code, language, testCases.rows);
    const status = passed === total ? 'accepted' : 'wrong_answer';
    
    let pointsEarned = 0;
    if (status === 'accepted') {
      const tpRes = await pool.query(
        `SELECT points FROM tournament_problems WHERE tournament_id = $1 AND problem_id = $2`,
        [id, problemId]
      );
      if (tpRes.rows.length > 0) {
        pointsEarned = tpRes.rows[0].points;
      }
    }

    await pool.query(
      `INSERT INTO tournament_submissions
         (tournament_id, user_id, problem_id, status, points_earned)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, problemId, status, pointsEarned]
    );

    if (pointsEarned > 0) {
      await pool.query(
        `UPDATE tournament_players SET score = score + $1 WHERE tournament_id = $2 AND user_id = $3`,
        [pointsEarned, id, userId]
      );
      
      // Update user_problem_status
      await pool.query(
        `INSERT INTO user_problem_status (user_id, problem_id, status, solved_at)
         VALUES ($1, $2, 'solved', NOW())
         ON CONFLICT (user_id, problem_id) 
         DO UPDATE SET status = 'solved', solved_at = COALESCE(user_problem_status.solved_at, NOW())`,
        [userId, problemId]
      );
    } else {
      await pool.query(
        `INSERT INTO user_problem_status (user_id, problem_id, status)
         VALUES ($1, $2, 'attempted')
         ON CONFLICT (user_id, problem_id) 
         DO UPDATE SET status = CASE WHEN user_problem_status.status = 'solved' THEN 'solved' ELSE 'attempted' END`,
        [userId, problemId]
      );
    }

    return res.status(200).json({ passed, total, status, pointsEarned, results });
  } catch (err) {
    console.error('submitTournamentCode error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET TOURNAMENT LEADERBOARD ───────────────────────────────────────────────
export const getTournamentLeaderboard = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT tp.score, tp.rank, u.username, u.rating
       FROM tournament_players tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.tournament_id = $1
       ORDER BY tp.score DESC`,
      [id]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('getTournamentLeaderboard error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};
