alter table public.user_locations
  add column if not exists expires_at timestamptz,
  add column if not exists precision_meters integer not null default 1000 check (precision_meters in (100, 1000));

create table if not exists public.location_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (requester_id, target_id)
);

alter table public.location_requests enable row level security;
create policy "location_requests_participants" on public.location_requests
  for all to authenticated
  using (auth.uid() = requester_id or auth.uid() = target_id)
  with check (auth.uid() = requester_id or auth.uid() = target_id);

create index if not exists location_requests_target_idx on public.location_requests (target_id, status);
