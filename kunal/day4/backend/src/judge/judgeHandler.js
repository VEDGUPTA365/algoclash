import { exec } from 'child_process';
import { promisify } from 'util';
import fs   from 'fs';
import path from 'path';
import os   from 'os';
import pool from '../config/db.js';

const execAsync = promisify(exec);

// ─── LANGUAGE CONFIG ──────────────────────────────────────────────────────────
const LANGUAGE_CONFIG = {
  python: {
    file:    'solution.py',
    compile: null,
    run:     (dir) => `python "${path.join(dir, 'solution.py')}"`,
  },
  javascript: {
    file:    'solution.js',
    compile: null,
    run:     (dir) => `node "${path.join(dir, 'solution.js')}"`,
  },
  cpp: {
    file:    'solution.cpp',
    compile: (dir) => `g++ -o "${path.join(dir, 'solution')}" "${path.join(dir, 'solution.cpp')}"`,
    run:     (dir) => `"${path.join(dir, 'solution')}"`,
  },
  c: {
    file:    'solution.c',
    compile: (dir) => `gcc -o "${path.join(dir, 'solution')}" "${path.join(dir, 'solution.c')}"`,
    run:     (dir) => `"${path.join(dir, 'solution')}"`,
  },
  java: {
    file:    'Main.java',
    compile: (dir) => `javac "${path.join(dir, 'Main.java')}"`,
    run:     (dir) => `java -cp "${dir}" Main`,
  },
};

// ─── EXECUTE CODE LOCALLY ─────────────────────────────────────────────────────
const executeLocally = async (code, language, input) => {
  const lang = LANGUAGE_CONFIG[language.toLowerCase()];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  // Create temp directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algoclash-'));

  try {
    // Write code to file
    const filePath = path.join(tmpDir, lang.file);
    fs.writeFileSync(filePath, code);

    // Write input to file
    const inputPath = path.join(tmpDir, 'input.txt');
    fs.writeFileSync(inputPath, input || '');

    // Compile if needed
    if (lang.compile) {
      try {
        await execAsync(lang.compile(tmpDir), { timeout: 10000 });
      } catch (compileErr) {
        return {
          stdout: '',
          stderr: compileErr.stderr || compileErr.message,
          error:  'Compile Error',
          code:   1,
        };
      }
    }

    // Run with input
    const runCmd = `${lang.run(tmpDir)} < "${inputPath}"`;
    try {
      const { stdout, stderr } = await execAsync(runCmd, {
        timeout: 10000,
        maxBuffer: 1024 * 1024,
      });
      return { stdout, stderr, error: null, code: 0 };
    } catch (runErr) {
      // Timeout
      if (runErr.killed) {
        return { stdout: '', stderr: 'Time Limit Exceeded', error: 'TLE', code: 1 };
      }
      return {
        stdout: runErr.stdout || '',
        stderr: runErr.stderr || runErr.message,
        error:  'Runtime Error',
        code:   1,
      };
    }

  } finally {
    // Cleanup temp files
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
};

// ─── RUN CODE AGAINST ALL TEST CASES ─────────────────────────────────────────
export const runCodeAgainstTests = async (code, language, testCases) => {
  const results = [];
  let passed = 0;

  for (const tc of testCases) {
    try {
      const result = await executeLocally(code, language, tc.input);

      if (result.error) {
        results.push({
          input:    tc.input,
          expected: (tc.expected_output || '').trim(),
          actual:   null,
          passed:   false,
          status:   result.error,
          stderr:   result.stderr,
        });
        continue;
      }

      const actualOutput   = (result.stdout || '').trim();
const expectedOutput = (tc.expected_output || '').trim();

// Reject if expected is empty — test case not properly set up
if (!expectedOutput) {
  results.push({
    input:    tc.input,
    expected: '(empty — test case not configured)',
    actual:   actualOutput,
    passed:   false,
    status:   'Test Case Error',
    error:    'Expected output is empty. Fix the test case in Admin panel.',
  });
  continue;
}

// Normalize and compare line by line
const normalizeOutput = (str) =>
  str.split('\n')
     .map(line => line.trimEnd())
     .join('\n')
     .trim();

const isCorrect = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);

      if (isCorrect) passed++;

      results.push({
        input:    tc.input,
        expected: expectedOutput,
        actual:   actualOutput,
        passed:   isCorrect,
        status:   isCorrect ? 'Accepted' : 'Wrong Answer',
        stderr:   result.stderr || null,
      });

    } catch (err) {
      console.error('❌ Execution error:', err.message);
      results.push({
        input:    tc.input,
        expected: (tc.expected_output || '').trim(),
        actual:   null,
        passed:   false,
        status:   'Error',
        error:    err.message,
      });
    }
  }

  return { passed, total: testCases.length, results };
};

// ─── RUN CODE (practice mode) ─────────────────────────────────────────────────
export const runCode = async (req, res) => {
  const { code, language, input } = req.body;

  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required.' });
  }

  if (!LANGUAGE_CONFIG[language.toLowerCase()]) {
    return res.status(400).json({
      message: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_CONFIG).join(', ')}`,
    });
  }

  try {
    const result = await executeLocally(code, language, input || '');
    return res.status(200).json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: result.error  || 'Accepted',
    });
  } catch (err) {
    console.error('runCode error:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

// ─── SUBMIT CODE (all test cases) ────────────────────────────────────────────
export const submitCode = async (req, res) => {
  const { problemId, code, language } = req.body;

  if (!problemId || !code || !language) {
    return res.status(400).json({ message: 'problemId, code, and language are required.' });
  }

  try {
    const testCases = await pool.query(
      'SELECT input, expected_output FROM test_cases WHERE problem_id = $1',
      [problemId]
    );

    if (testCases.rows.length === 0) {
      return res.status(404).json({ message: 'No test cases found.' });
    }

    const { passed, total, results } = await runCodeAgainstTests(
      code, language, testCases.rows
    );

    const status = passed === total ? 'accepted' : 'wrong_answer';

    await pool.query(
      `INSERT INTO submissions
         (user_id, problem_id, language, code, status, tests_passed, tests_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, problemId, language, code, status, passed, total]
    );

    const problemStatus = passed === total ? 'solved' : 'attempted';
    await pool.query(
      `INSERT INTO user_problem_status (user_id, problem_id, status, solved_at)
       VALUES ($1, $2, $3, CASE WHEN $3::varchar = 'solved' THEN NOW() ELSE NULL END)
       ON CONFLICT (user_id, problem_id) 
       DO UPDATE SET 
         status = CASE 
           WHEN user_problem_status.status = 'solved' THEN 'solved' 
           ELSE EXCLUDED.status 
         END,
         solved_at = CASE 
           WHEN user_problem_status.status = 'solved' THEN user_problem_status.solved_at 
           WHEN EXCLUDED.status = 'solved' THEN NOW()
           ELSE NULL 
         END`,
      [req.user.id, problemId, problemStatus]
    );

    return res.status(200).json({ passed, total, status, results });

  } catch (err) {
    console.error('submitCode error:', err.message);
    return res.status(500).json({ message: err.message });
  }
};