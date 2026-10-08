-- Raqam · initial schema
-- All timestamps are unix epoch milliseconds (INTEGER). Days are local 'YYYY-MM-DD' text.

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE profile (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  name           TEXT    NOT NULL DEFAULT '',
  avatar         TEXT    NOT NULL DEFAULT 'sigma',
  comfort_level  TEXT    NOT NULL DEFAULT 'beginner',
  goal           TEXT    NOT NULL DEFAULT 'general',
  onboarded      INTEGER NOT NULL DEFAULT 0,
  placement_done INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL
);

-- Per-topic skill state. mastery is 0..100.
CREATE TABLE topic_progress (
  topic_id        TEXT PRIMARY KEY,
  mastery         REAL    NOT NULL DEFAULT 0,
  attempts        INTEGER NOT NULL DEFAULT 0,
  correct         INTEGER NOT NULL DEFAULT 0,
  recent          TEXT    NOT NULL DEFAULT '',   -- last results as a string of 1/0, newest last
  difficulty      REAL    NOT NULL DEFAULT 2,    -- adaptive difficulty estimate (1..6)
  last_practiced  INTEGER,
  total_time_ms   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE lesson_progress (
  lesson_id     TEXT PRIMARY KEY,
  status        TEXT    NOT NULL DEFAULT 'started' CHECK (status IN ('started','completed')),
  step          INTEGER NOT NULL DEFAULT 0,
  stars         INTEGER NOT NULL DEFAULT 0,
  started_at    INTEGER NOT NULL,
  completed_at  INTEGER,
  last_opened   INTEGER NOT NULL
);

CREATE TABLE sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  mode        TEXT    NOT NULL,                 -- normal, quick, endless, timed, weak, mix, review, daily, placement, lesson
  topic_id    TEXT,
  difficulty  INTEGER,
  planned     INTEGER,
  started_at  INTEGER NOT NULL,
  ended_at    INTEGER,
  total       INTEGER NOT NULL DEFAULT 0,
  correct     INTEGER NOT NULL DEFAULT 0,
  xp          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE attempts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id     INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  exam_id        INTEGER,
  topic_id       TEXT    NOT NULL,
  generator_id   TEXT    NOT NULL,
  qtype          TEXT    NOT NULL,
  difficulty     INTEGER NOT NULL,
  user_answer    TEXT,
  correct_answer TEXT    NOT NULL,
  is_correct     INTEGER NOT NULL,
  hints_used     INTEGER NOT NULL DEFAULT 0,
  time_ms        INTEGER NOT NULL DEFAULT 0,
  xp             INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL
);
CREATE INDEX idx_attempts_topic   ON attempts(topic_id, created_at);
CREATE INDEX idx_attempts_created ON attempts(created_at);
CREATE INDEX idx_attempts_session ON attempts(session_id);

CREATE TABLE mistakes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id       TEXT    NOT NULL,
  generator_id   TEXT    NOT NULL,
  qtype          TEXT    NOT NULL,
  difficulty     INTEGER NOT NULL,
  question_json  TEXT    NOT NULL,              -- full serialisable question (re-playable)
  user_answer    TEXT,
  correct_answer TEXT    NOT NULL,
  pattern_id     TEXT,                          -- detected error pattern
  times_wrong    INTEGER NOT NULL DEFAULT 1,
  times_retried  INTEGER NOT NULL DEFAULT 0,
  understood     INTEGER NOT NULL DEFAULT 0,
  favorite       INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  last_seen      INTEGER NOT NULL
);
CREATE INDEX idx_mistakes_topic   ON mistakes(topic_id);
CREATE INDEX idx_mistakes_pattern ON mistakes(pattern_id);

CREATE TABLE exams (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kind          TEXT    NOT NULL,               -- quick, topic, level, mixed, custom, final
  title         TEXT    NOT NULL,
  config_json   TEXT    NOT NULL,
  questions_json TEXT   NOT NULL,
  answers_json  TEXT    NOT NULL DEFAULT '{}',
  flags_json    TEXT    NOT NULL DEFAULT '[]',
  time_limit_s  INTEGER,
  elapsed_s     INTEGER NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','finished','abandoned')),
  score         INTEGER,
  total         INTEGER NOT NULL,
  started_at    INTEGER NOT NULL,
  finished_at   INTEGER
);

CREATE TABLE xp_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  amount     INTEGER NOT NULL,
  reason     TEXT    NOT NULL,
  created_at INTEGER NOT NULL
);

-- One row per calendar day with any activity (drives streaks, heatmap, weekly charts).
CREATE TABLE activity_days (
  day         TEXT PRIMARY KEY,
  xp          INTEGER NOT NULL DEFAULT 0,
  questions   INTEGER NOT NULL DEFAULT 0,
  correct     INTEGER NOT NULL DEFAULT 0,
  lessons     INTEGER NOT NULL DEFAULT 0,
  minutes     REAL    NOT NULL DEFAULT 0
);

CREATE TABLE achievements (
  id          TEXT PRIMARY KEY,
  unlocked_at INTEGER NOT NULL
);

CREATE TABLE formula_favorites (
  formula_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE daily_challenges (
  day          TEXT PRIMARY KEY,
  seed         INTEGER NOT NULL,
  completed    INTEGER NOT NULL DEFAULT 0,
  score        INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER
);

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  content    TEXT    NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

INSERT INTO profile (id, created_at) VALUES (1, CAST(strftime('%s','now') AS INTEGER) * 1000);
INSERT INTO notes   (id, updated_at) VALUES (1, CAST(strftime('%s','now') AS INTEGER) * 1000);
