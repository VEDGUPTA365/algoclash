-- AlgoClash Database Schema
-- ─────────────────────────────────────────
-- USERS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(10)  NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  rating     INT DEFAULT 800,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PROBLEMS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS problems (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  difficulty  VARCHAR(10)  NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  source      VARCHAR(255) DEFAULT 'manual',
  tags        TEXT[] DEFAULT '{}',
  is_public   BOOLEAN DEFAULT TRUE,
  created_by  INT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TEST CASES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_cases (
  id         SERIAL PRIMARY KEY,
  problem_id INT  NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  input      TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample  BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────
-- DUELS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duels (
  id         SERIAL PRIMARY KEY,
  room_code  VARCHAR(10)  UNIQUE NOT NULL,
  problem_id INT REFERENCES problems(id) ON DELETE SET NULL,
  player1_id INT REFERENCES users(id) ON DELETE SET NULL,
  player2_id INT REFERENCES users(id) ON DELETE SET NULL,
  winner_id  INT REFERENCES users(id) ON DELETE SET NULL,
  status     VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  player1_rating_change INT DEFAULT 0,
  player2_rating_change INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

-- ─────────────────────────────────────────
-- SUBMISSIONS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id           SERIAL PRIMARY KEY,
  user_id      INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id   INT  NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  duel_id      INT  REFERENCES duels(id) ON DELETE SET NULL,
  language     VARCHAR(30) NOT NULL,
  code         TEXT NOT NULL,
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'wrong_answer', 'error')),
  tests_passed INT DEFAULT 0,
  tests_total  INT DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LEADERBOARD VIEW
-- ─────────────────────────────────────────
DROP VIEW IF EXISTS leaderboard;
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.username,
  u.rating,
  COUNT(d.id)    AS total_duels,
  COUNT(CASE WHEN d.winner_id = u.id THEN 1 END)      AS wins,
  COUNT(CASE WHEN d.winner_id != u.id
             AND (d.player1_id = u.id OR d.player2_id = u.id)
             AND d.status = 'finished' THEN 1 END)    AS losses,
  ROUND(
    CASE
      WHEN COUNT(CASE WHEN d.status = 'finished'
                      AND (d.player1_id = u.id OR d.player2_id = u.id)
                 THEN 1 END) = 0 THEN 0
      ELSE COUNT(CASE WHEN d.winner_id = u.id THEN 1 END)::DECIMAL /
           COUNT(CASE WHEN d.status = 'finished'
                      AND (d.player1_id = u.id OR d.player2_id = u.id)
                 THEN 1 END) * 100
    END, 1
  )                                                    AS win_rate
FROM users u
LEFT JOIN duels d
  ON (d.player1_id = u.id OR d.player2_id = u.id)
WHERE u.role = 'student'
GROUP BY u.id, u.username, u.rating
ORDER BY u.rating DESC;

-- ─────────────────────────────────────────
-- USER PROBLEM STATUS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_problem_status (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  status     VARCHAR(20) DEFAULT 'none' CHECK (status IN ('none', 'attempted', 'solved')),
  marked     BOOLEAN DEFAULT FALSE,
  solved_at  TIMESTAMP,
  PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_user_problem_status ON user_problem_status(user_id);

-- (Tournaments tables removed)


-- ─────────────────────────────────────────
-- INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id   ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_duel_id   ON submissions(duel_id);
CREATE INDEX IF NOT EXISTS idx_duels_room_code       ON duels(room_code);

-- ─────────────────────────────────────────
-- SEED: Default Admin User
-- Password: admin123 (bcrypt hashed)
-- Change this immediately in production!
-- ─────────────────────────────────────────
INSERT INTO users (username, email, password, role)
VALUES (
  'admin',
  'admin@algoclash.dev',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
) ON CONFLICT (username) DO NOTHING;
