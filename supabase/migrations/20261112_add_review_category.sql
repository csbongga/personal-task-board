-- Migration: Add 'review' (รีวิวบทความ) to tasks.category check constraint
alter table tasks drop constraint if exists tasks_category_check;

alter table tasks add constraint tasks_category_check
  check (category in ('article', 'teaching', 'research', 'advising', 'review', 'other'));

notify pgrst, 'reload schema';
