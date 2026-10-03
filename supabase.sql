create table if not exists public.delite_cravings_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.delite_cravings_state enable row level security;

create index if not exists delite_cravings_state_updated_at_idx
  on public.delite_cravings_state(updated_at);
