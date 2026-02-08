-- Add rank column to task table for drag-and-drop ordering
-- MySQL-specific version (uses FLOAT instead of REAL, backticks around 'rank' keyword)

-- Add the rank column (nullable initially)
ALTER TABLE task ADD COLUMN `rank` FLOAT;

-- Assign initial rank values to existing tasks (1000, 2000, 3000, etc.)
-- This gives room for insertions between tasks
UPDATE task SET `rank` = id * 1000.0;

-- Make rank NOT NULL now that all rows have values
ALTER TABLE task MODIFY `rank` FLOAT NOT NULL;
