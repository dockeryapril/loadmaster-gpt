-- Create logging tables for errors and general events
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  error text not null,
  stack text,
  context jsonb,
  timestamp timestamptz default now()
);

create table if not exists public.log_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  data jsonb,
  timestamp timestamptz default now()
);
