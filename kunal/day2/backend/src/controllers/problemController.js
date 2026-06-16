import pool from '../config/db.js';


// ─── GET ALL PROBLEMS ────────────────────────────────────────────────────────
export const getProblems = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT p.id, p.title, p.difficulty, p.source, p.created_at, p.tags, p.is_public,
              COUNT(t.id) AS test_count,
              ups.status, ups.marked
       FROM problems p
       LEFT JOIN test_cases t ON t.problem_id = p.id
       LEFT JOIN user_problem_status ups ON ups.problem_id = p.id AND ups.user_id = $1
       WHERE p.is_public = TRUE OR $2 = TRUE
       GROUP BY p.id, ups.status, ups.marked
       ORDER BY p.created_at DESC`,
      [userId, isAdmin]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('getProblems error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET SINGLE PROBLEM ──────────────────────────────────────────────────────
export const getProblemById = async (req, res) => {
  const { id } = req.params;
  try {
    const isAdmin = req.user.role === 'admin';
    const problem = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND (is_public = TRUE OR $2 = TRUE)',
      [id, isAdmin]
    );
    if (problem.rows.length === 0) {
      return res.status(404).json({ message: 'Problem not found or access denied.' });
    }

    // Only return sample test cases to students
    const testCases = await pool.query(
      'SELECT id, input, expected_output FROM test_cases WHERE problem_id = $1 AND is_sample = TRUE',
      [id]
    );

    return res.status(200).json({
      ...problem.rows[0],
      sampleTestCases: testCases.rows,
    });
  } catch (err) {
    console.error('getProblemById error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CREATE PROBLEM MANUALLY (Admin) ─────────────────────────────────────────
export const createProblem = async (req, res) => {
  const { title, description, difficulty, testCases, tags, isPublic } = req.body;

  if (!title || !description || !difficulty) {
    return res.status(400).json({ message: 'Title, description and difficulty are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const problemResult = await client.query(
      `INSERT INTO problems (title, description, difficulty, source, tags, is_public, created_by)
       VALUES ($1, $2, $3, 'manual', $4, $5, $6) RETURNING *`,
      [title, description, difficulty, tags || [], isPublic ?? true, req.user.id]
    );

    const problem = problemResult.rows[0];

    // Insert test cases if provided
    if (testCases && testCases.length > 0) {
      for (const tc of testCases) {
        await client.query(
          `INSERT INTO test_cases (problem_id, input, expected_output, is_sample)
           VALUES ($1, $2, $3, $4)`,
          [problem.id, tc.input, tc.expectedOutput, tc.isSample ?? false]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json(problem);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createProblem error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ─── DELETE PROBLEM (Admin) ───────────────────────────────────────────────────
export const deleteProblem = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM problems WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Problem deleted.' });
  } catch (err) {
    console.error('deleteProblem error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── UPDATE PROBLEM (Admin) ───────────────────────────────────────────────────
export const updateProblem = async (req, res) => {
  const { id } = req.params;
  const { tags, isPublic } = req.body;
  try {
    const result = await pool.query(
      `UPDATE problems 
       SET tags = COALESCE($1, tags), 
           is_public = COALESCE($2, is_public) 
       WHERE id = $3 RETURNING *`,
      [tags, isPublic, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Problem not found.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('updateProblem error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};
