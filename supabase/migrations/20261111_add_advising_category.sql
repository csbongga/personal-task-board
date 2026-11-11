-- Migration: Add 'advising' to tasks category CHECK constraint
-- Author: Senior Backend & Database Engineer
-- Date: 2026-11-11
-- Description: Update tasks_category_check to allow 'advising' along with 'article', 'teaching', 'research', and 'other'.

alter table tasks drop constraint if exists tasks_category_check;

alter table tasks add constraint tasks_category_check
  check (category in ('article', 'teaching', 'research', 'advising', 'other'));

-- Notify PostgREST to reload schema cache
notify pgrst, 'reload schema';
