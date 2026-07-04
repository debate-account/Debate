-- Custom formats & drills for logged-in users.
-- Run ONCE in your existing Supabase project: Dashboard → SQL Editor → New query
-- → paste this whole file → Run. No new project or secrets needed.

create table if not exists public.custom_formats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,          -- rules / notes
  speeches text,             -- one speech line per newline
  criteria text,             -- one judging criterion per newline
  created_at timestamptz not null default now()
);

create table if not exists public.custom_drills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  tag text,                  -- short chip label
  blurb text,                -- one-line card description
  instructions text,         -- plain-language "what should this drill practice?"
  created_at timestamptz not null default now()
);

alter table public.custom_formats enable row level security;
alter table public.custom_drills  enable row level security;

-- Each user can see and manage only their own rows.
drop policy if exists "own custom_formats" on public.custom_formats;
drop policy if exists "own custom_drills"  on public.custom_drills;

create policy "own custom_formats" on public.custom_formats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own custom_drills" on public.custom_drills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
