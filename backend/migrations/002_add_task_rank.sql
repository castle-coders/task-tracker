-- Add rank column to task table for drag-and-drop ordering
-- Using REAL (float) to allow fractional ranking for efficient reordering
-- SQLite version - see 002_add_task_rank.mysql.sql for MySQL-specific version

-- Add the rank column (nullable initially)
ALTER TABLE task ADD COLUMN rank REAL;

-- Assign initial rank values to existing tasks (1000, 2000, 3000, etc.)
-- This gives room for insertions between tasks
UPDATE task SET rank = id * 1000.0;

-- Make rank NOT NULL now that all rows have values
-- Note: SQLite doesn't support ALTER COLUMN directly, so we handle this via the default
-- For MySQL, see 002_add_task_rank.mysql.sql (uses FLOAT and backticks around 'rank' keyword)
