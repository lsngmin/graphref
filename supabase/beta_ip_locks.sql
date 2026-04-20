create table if not exists public.beta_ip_locks (
  ip_hash text primary key,
  name text not null,
  locale text,
  email text not null,
  test_url text not null,
  search_console text,
  current_rank text,
  message text,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.beta_ip_locks add column if not exists name text;
alter table public.beta_ip_locks add column if not exists test_url text;
alter table public.beta_ip_locks add column if not exists search_console text;
alter table public.beta_ip_locks add column if not exists current_rank text;
alter table public.beta_ip_locks add column if not exists message text;
alter table public.beta_ip_locks add column if not exists consent boolean not null default false;

alter table public.beta_ip_locks enable row level security;
