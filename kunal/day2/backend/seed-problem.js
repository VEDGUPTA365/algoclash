import pool from './src/config/db.js';

async function seed() {
  try {
    const res = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = res.rows.length > 0 ? res.rows[0].id : null;

    const problemResult = await pool.query(
      `INSERT INTO problems (title, description, difficulty, source, tags, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'Reverse a String',
        'Write a program that takes a single word as input and prints the reversed word.\n\n### Example 1\n**Input:**\n```\nhello\n```\n**Output:**\n```\nolleh\n```\n\n### Example 2\n**Input:**\n```\nworld\n```\n**Output:**\n```\ndlrow\n```',
        'Easy',
        'manual',
        ['strings', 'basics'],
        true,
        adminId
      ]
    );

    const problemId = problemResult.rows[0].id;

    const testCases = [
      { input: 'hello', expected_output: 'olleh', is_sample: true },
      { input: 'world', expected_output: 'dlrow', is_sample: true },
      { input: 'algoclash', expected_output: 'hsalcogla', is_sample: false },
      { input: 'a', expected_output: 'a', is_sample: false }
    ];

    for (const tc of testCases) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, expected_output, is_sample)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.expected_output, tc.is_sample]
      );
    }

    console.log('Successfully inserted problem ID:', problemId);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

seed();
