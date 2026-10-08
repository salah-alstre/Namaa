-- English learning platform. Purely additive: no existing (math) table is touched.
-- Content (lessons, words, grammar, readings) lives in the app bundle; these tables hold the learner's state.
-- Timestamps are unix epoch milliseconds, days are local 'YYYY-MM-DD'.

CREATE TABLE english_lesson_progress (
  lesson_id     TEXT PRIMARY KEY,
  status        TEXT    NOT NULL DEFAULT 'started' CHECK (status IN ('started','completed')),
  step          INTEGER NOT NULL DEFAULT 0,
  stars         INTEGER NOT NULL DEFAULT 0,
  started_at    INTEGER NOT NULL,
  completed_at  INTEGER,
  last_opened   INTEGER NOT NULL
);

-- One row per word the learner has met. The SRS fields are driven by english-engine/srs.ts.
CREATE TABLE english_vocab (
  word_id       TEXT PRIMARY KEY,
  state         TEXT    NOT NULL DEFAULT 'learning' CHECK (state IN ('learning','review')),
  reps          INTEGER NOT NULL DEFAULT 0,
  lapses        INTEGER NOT NULL DEFAULT 0,
  interval_days REAL    NOT NULL DEFAULT 0,
  ease          REAL    NOT NULL DEFAULT 2.5,
  due_at        INTEGER NOT NULL,
  last_reviewed INTEGER,
  seen          INTEGER NOT NULL DEFAULT 0,
  correct       INTEGER NOT NULL DEFAULT 0,
  favorite      INTEGER NOT NULL DEFAULT 0,
  difficult     INTEGER NOT NULL DEFAULT 0,
  source        TEXT    NOT NULL DEFAULT '',
  added_at      INTEGER NOT NULL
);
CREATE INDEX idx_english_vocab_due ON english_vocab(due_at);

CREATE TABLE english_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id TEXT    NOT NULL,
  kind        TEXT    NOT NULL,
  skill       TEXT    NOT NULL,   -- vocab, grammar, listening, reading, writing
  ref_id      TEXT    NOT NULL DEFAULT '',
  correct     INTEGER NOT NULL,
  answer      TEXT    NOT NULL DEFAULT '',
  time_ms     INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_english_attempts_skill ON english_attempts(skill, created_at);
CREATE INDEX idx_english_attempts_created ON english_attempts(created_at);

CREATE TABLE english_skill_progress (
  skill          TEXT PRIMARY KEY,
  mastery        REAL    NOT NULL DEFAULT 0,
  attempts       INTEGER NOT NULL DEFAULT 0,
  correct        INTEGER NOT NULL DEFAULT 0,
  recent         TEXT    NOT NULL DEFAULT '',
  last_practiced INTEGER
);

CREATE TABLE english_mistakes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id   TEXT    NOT NULL,
  kind          TEXT    NOT NULL,
  skill         TEXT    NOT NULL,
  pattern_id    TEXT    NOT NULL DEFAULT '',   -- e.g. be-verb, article, plural, word-order
  ref_id        TEXT    NOT NULL DEFAULT '',   -- lesson / word / grammar id the question came from
  prompt        TEXT    NOT NULL,
  given         TEXT    NOT NULL DEFAULT '',
  expected      TEXT    NOT NULL DEFAULT '',
  explanation   TEXT    NOT NULL DEFAULT '',   -- JSON L10n
  status        TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open','understood')),
  times_wrong   INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_english_mistakes_ex ON english_mistakes(exercise_id);
CREATE INDEX idx_english_mistakes_pattern ON english_mistakes(pattern_id);

CREATE TABLE english_placement (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  level       TEXT    NOT NULL,
  score       REAL    NOT NULL,
  total       INTEGER NOT NULL,
  correct     INTEGER NOT NULL,
  detail_json TEXT    NOT NULL DEFAULT '{}',
  created_at  INTEGER NOT NULL
);

CREATE TABLE english_writing (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_id   TEXT    NOT NULL,
  body        TEXT    NOT NULL,
  checks_json TEXT    NOT NULL DEFAULT '[]',
  created_at  INTEGER NOT NULL
);

CREATE TABLE english_speaking (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  phrase_id   TEXT    NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 3),   -- 1 hard, 2 ok, 3 easy (self-rated)
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_english_speaking_phrase ON english_speaking(phrase_id);

-- Finished readings, bookmarked grammar topics, etc.
CREATE TABLE english_bookmarks (
  kind        TEXT    NOT NULL,   -- grammar, reading, phrase
  ref_id      TEXT    NOT NULL,
  state       TEXT    NOT NULL DEFAULT 'saved',   -- saved, done
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (kind, ref_id)
);
