create table if not exists public.account_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  language text not null default 'tr',
  theme text not null default 'ocean',
  profile_private boolean not null default false,
  two_factor_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.account_preferences enable row level security;
create policy "Users manage own preferences" on public.account_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.account_devices (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  device_name text not null, last_seen_at timestamptz not null default now(), created_at timestamptz not null default now()
);
alter table public.account_devices enable row level security;
create policy "Users manage own devices" on public.account_devices for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
