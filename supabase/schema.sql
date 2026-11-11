-- Schema for Personal Task Board (งานอาจารย์เปรม)
-- Run this script in the Supabase SQL Editor

-- 1. Create tables
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'other' check (category in ('article', 'teaching', 'research', 'advising', 'review', 'other')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'polish', 'waiting', 'done')),
  waiting_for text null,
  priority int not null default 2 check (priority in (1, 2, 3)),
  due_date date null,
  note text null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  done_at timestamptz null,
  position int not null default 0
);

create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- 2. Indexes for fast querying & sorting
create index if not exists idx_tasks_status_position on tasks(status, position);
create index if not exists idx_steps_task_id_position on steps(task_id, position);
create index if not exists idx_activity_task_id_created_at_desc on activity(task_id, created_at desc);

-- 3. Automatic updated_at trigger for tasks
create or replace function update_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at
before update on tasks
for each row
execute function update_tasks_updated_at();

-- 4. Enable Row Level Security (RLS) on all tables
-- With RLS enabled and NO policies created, anon/authenticated keys cannot access data directly.
-- Only the service_role key (used by our server-side Next.js actions) bypasses RLS safely.
alter table tasks enable row level security;
alter table steps enable row level security;
alter table activity enable row level security;
