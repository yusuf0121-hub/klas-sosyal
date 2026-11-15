create table if not exists public.social_events (
 id uuid primary key default gen_random_uuid(), host_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 2 and 120), description text not null default '',
 starts_at timestamptz not null, location text, visibility text not null default 'public' check (visibility in ('public','private')), created_at timestamptz not null default now()
);
create table if not exists public.social_event_attendees (
 event_id uuid not null references public.social_events(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'going' check (status in ('going','interested')), created_at timestamptz not null default now(), primary key (event_id,user_id)
);
create table if not exists public.social_playlists (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 2 and 100), description text not null default '',
 is_collaborative boolean not null default false, visibility text not null default 'public' check (visibility in ('public','private')), created_at timestamptz not null default now()
);
create table if not exists public.social_playlist_items (
 id uuid primary key default gen_random_uuid(), playlist_id uuid not null references public.social_playlists(id) on delete cascade,
 added_by uuid not null references auth.users(id) on delete cascade, media_url text not null, title text not null,
 position integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.social_watch_parties (
 id uuid primary key default gen_random_uuid(), host_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 2 and 120), media_url text not null,
 is_live boolean not null default false, playback_seconds integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.social_watch_party_members (
 party_id uuid not null references public.social_watch_parties(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(), primary key (party_id,user_id)
);
alter table public.social_events enable row level security;
alter table public.social_event_attendees enable row level security;
alter table public.social_playlists enable row level security;
alter table public.social_playlist_items enable row level security;
alter table public.social_watch_parties enable row level security;
alter table public.social_watch_party_members enable row level security;
create policy "read visible social events" on public.social_events for select to authenticated using (visibility='public' or host_id=(select auth.uid()));
create policy "create own social events" on public.social_events for insert to authenticated with check (host_id=(select auth.uid()));
create policy "update own social events" on public.social_events for update to authenticated using (host_id=(select auth.uid())) with check (host_id=(select auth.uid()));
create policy "delete own social events" on public.social_events for delete to authenticated using (host_id=(select auth.uid()));
create policy "read event attendees" on public.social_event_attendees for select to authenticated using (exists (select 1 from public.social_events e where e.id=event_id and (e.visibility='public' or e.host_id=(select auth.uid()))));
create policy "manage own event attendance" on public.social_event_attendees for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "read visible playlists" on public.social_playlists for select to authenticated using (visibility='public' or owner_id=(select auth.uid()));
create policy "create own playlists" on public.social_playlists for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "update own playlists" on public.social_playlists for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "delete own playlists" on public.social_playlists for delete to authenticated using (owner_id=(select auth.uid()));
create policy "read items of visible playlists" on public.social_playlist_items for select to authenticated using (exists (select 1 from public.social_playlists p where p.id=playlist_id and (p.visibility='public' or p.owner_id=(select auth.uid()))));
create policy "manage items of own playlists" on public.social_playlist_items for all to authenticated using (exists (select 1 from public.social_playlists p where p.id=playlist_id and (p.owner_id=(select auth.uid()) or (p.is_collaborative and p.visibility='public')))) with check (exists (select 1 from public.social_playlists p where p.id=playlist_id and (p.owner_id=(select auth.uid()) or (p.is_collaborative and p.visibility='public'))) and added_by=(select auth.uid()));
create policy "read social watch parties" on public.social_watch_parties for select to authenticated using (true);
create policy "create own watch parties" on public.social_watch_parties for insert to authenticated with check (host_id=(select auth.uid()));
create policy "update own watch parties" on public.social_watch_parties for update to authenticated using (host_id=(select auth.uid())) with check (host_id=(select auth.uid()));
create policy "delete own watch parties" on public.social_watch_parties for delete to authenticated using (host_id=(select auth.uid()));
create policy "read watch party members" on public.social_watch_party_members for select to authenticated using (true);
create policy "join watch party as self" on public.social_watch_party_members for insert to authenticated with check (user_id=(select auth.uid()));
create policy "leave watch party as self" on public.social_watch_party_members for delete to authenticated using (user_id=(select auth.uid()));
create index if not exists social_events_starts_idx on public.social_events(starts_at);
create index if not exists social_playlists_owner_idx on public.social_playlists(owner_id,created_at desc);
create index if not exists social_playlist_items_order_idx on public.social_playlist_items(playlist_id,position);
create index if not exists social_watch_parties_live_idx on public.social_watch_parties(is_live,created_at desc);
