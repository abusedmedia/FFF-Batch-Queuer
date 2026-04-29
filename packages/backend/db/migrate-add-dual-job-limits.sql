-- Add dual limit counters for existing jobs table.
-- Apply with:
--   wrangler d1 execute fff-batch-queuer --local  --file=./db/migrate-add-dual-job-limits.sql
--   wrangler d1 execute fff-batch-queuer --remote --file=./db/migrate-add-dual-job-limits.sql

ALTER TABLE jobs ADD COLUMN error_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN success_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN success_limit INTEGER NOT NULL DEFAULT 1;
