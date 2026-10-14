create table if not exists public.user_locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  share_location boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_locations enable row level security;

drop policy if exists "users_manage_own_location" on public.user_locations;
create policy "users_manage_own_location" on public.user_locations
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "followers_view_shared_locations" on public.user_locations;
create policy "followers_view_shared_locations" on public.user_locations
  for select to authenticated
  using (
    share_location = true
    and (user_id = auth.uid() or exists (
      select 1 from public.follows
      where follows.follower_id = auth.uid()
        and follows.following_id = user_locations.user_id
    ))
  );

create index if not exists user_locations_shared_idx on public.user_locations (share_location, updated_at desc);
