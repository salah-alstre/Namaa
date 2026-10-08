-- Per-question time spent in an exam (JSON object: question id -> seconds).
ALTER TABLE exams ADD COLUMN times_json TEXT NOT NULL DEFAULT '{}';
