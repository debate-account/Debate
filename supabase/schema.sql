-- Run this in the Supabase SQL editor.

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  motion text,
  side text,
  format text,
  transcript jsonb,
  scores jsonb
);

alter table rounds enable row level security;

create policy "read own rounds"  on rounds for select using (auth.uid() = user_id);
create policy "insert own rounds" on rounds for insert with check (auth.uid() = user_id);
