import pool from '../config/db.js';

// ─── TOGGLE MARK ──────────────────────────────────────────────────────────────
export const toggleMark = async (req, res) => {
  const { problemId } = req.body;
  const userId = req.user.id;

  if (!problemId) {
    return res.status(400).json({ message: 'Problem ID is required.' });
  }

  try {
    // Upsert marked status
    const result = await pool.query(
      `INSERT INTO user_problem_status (user_id, problem_id, marked)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (user_id, problem_id)
       DO UPDATE SET marked = NOT user_problem_status.marked
       RETURNING marked`,
      [userId, problemId]
    );

    return res.status(200).json({ marked: result.rows[0].marked });
  } catch (err) {
    console.error('toggleMark error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};
