-- Initial schema for concert-drops.
--
-- Access model:
--   * Everyone (signed in or not) can read the drops data; the site is public.
--   * Only the owner can change settings or their drop schedule.
--   * The daily refresh job writes everything else using the secret key,
--     which bypasses row level security.
--   * Spotify credentials and refresh logs are never readable through the API.

-- ---------------------------------------------------------------------------
-- Cities and settings
-- ---------------------------------------------------------------------------

create table public.cities (
  id text primary key,                         -- e.g. 'san-francisco'
  name text not null,
  time_zone text not null,                     -- IANA name, e.g. 'America/Los_Angeles'
  latitude double precision not null,
  longitude double precision not null,
  radius_miles integer not null default 25 check (radius_miles > 0)
);

-- A single row (enforced by the boolean primary key) holding site-wide settings.
create table public.settings (
  id boolean primary key default true check (id),
  owner_user_id uuid references auth.users (id) on delete set null,
  current_city_id text not null references public.cities (id)
);

-- True when the signed-in user is the site owner.
-- security definer lets policies call it without needing access to settings themselves.
create function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.settings
    where owner_user_id is not null
      and owner_user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Artists and how much I listen to them
-- ---------------------------------------------------------------------------

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  spotify_id text not null unique,
  name text not null,
  image_url text,
  genres text[] not null default '{}',
  ticketmaster_attraction_id text,
  -- 'manual' means I corrected the match by hand, so the refresh job leaves it alone.
  ticketmaster_match text not null default 'unmatched'
    check (ticketmaster_match in ('unmatched', 'matched', 'not_found', 'manual')),
  updated_at timestamptz not null default now()
);

-- One row per Spotify list an artist appears in.
create table public.artist_affinity (
  artist_id uuid not null references public.artists (id) on delete cascade,
  source text not null
    check (source in ('top_short_term', 'top_medium_term', 'top_long_term', 'followed')),
  rank integer check (rank > 0),               -- position in a top list; null for followed
  captured_at timestamptz not null default now(),
  primary key (artist_id, source)
);

-- ---------------------------------------------------------------------------
-- Venues, events and when tickets go on sale
-- ---------------------------------------------------------------------------

create table public.venues (
  id text primary key,                         -- Ticketmaster venue id
  name text not null,
  city text,
  state_code text,
  country_code text,
  time_zone text,
  latitude double precision,
  longitude double precision,
  capacity integer check (capacity > 0)        -- curated by hand; Ticketmaster doesn't provide it
);

create table public.events (
  id text primary key,                         -- Ticketmaster event id
  city_id text not null references public.cities (id),
  venue_id text references public.venues (id),
  name text not null,
  starts_at timestamptz,                       -- null while the time is TBA
  local_date date,                             -- known even when the time isn't
  url text,
  status text,                                 -- Ticketmaster status: onsale, cancelled, ...
  updated_at timestamptz not null default now()
);

create index events_city_id_local_date_idx on public.events (city_id, local_date);

-- An event can have several artists (co-headliners, supporting acts).
create table public.event_artists (
  event_id text not null references public.events (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  primary key (event_id, artist_id)
);

create index event_artists_artist_id_idx on public.event_artists (artist_id);

-- Each presale and the general on-sale for an event.
create table public.sale_windows (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  kind text not null check (kind in ('presale', 'public')),
  name text not null,                          -- e.g. 'Artist Presale', 'Public Onsale'
  starts_at timestamptz not null,
  ends_at timestamptz,
  url text,
  unique (event_id, kind, name, starts_at)
);

create index sale_windows_starts_at_idx on public.sale_windows (starts_at);

-- The drops I've ticked.
create table public.schedule_items (
  sale_window_id uuid primary key references public.sale_windows (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Server-only tables
-- ---------------------------------------------------------------------------

-- Spotify refresh token for the daily job. Single row.
create table public.spotify_credentials (
  id boolean primary key default true check (id),
  refresh_token text not null,
  authorized_at timestamptz not null,          -- Spotify tokens now expire six months after this
  updated_at timestamptz not null default now()
);

create table public.refresh_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  summary jsonb,
  error text
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.cities enable row level security;
alter table public.settings enable row level security;
alter table public.artists enable row level security;
alter table public.artist_affinity enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.event_artists enable row level security;
alter table public.sale_windows enable row level security;
alter table public.schedule_items enable row level security;
alter table public.spotify_credentials enable row level security;
alter table public.refresh_runs enable row level security;

-- Public read access.
create policy "Anyone can read cities" on public.cities for select using (true);
create policy "Anyone can read settings" on public.settings for select using (true);
create policy "Anyone can read artists" on public.artists for select using (true);
create policy "Anyone can read artist affinity" on public.artist_affinity for select using (true);
create policy "Anyone can read venues" on public.venues for select using (true);
create policy "Anyone can read events" on public.events for select using (true);
create policy "Anyone can read event artists" on public.event_artists for select using (true);
create policy "Anyone can read sale windows" on public.sale_windows for select using (true);
create policy "Anyone can read the drop schedule" on public.schedule_items for select using (true);

-- Owner-only changes.
create policy "Owner can change the current city" on public.settings
  for update to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "Owner can add drops to the schedule" on public.schedule_items
  for insert to authenticated
  with check ((select public.is_owner()));

create policy "Owner can remove drops from the schedule" on public.schedule_items
  for delete to authenticated
  using ((select public.is_owner()));

-- spotify_credentials and refresh_runs have no policies: only the secret key can use them.

-- ---------------------------------------------------------------------------
-- Grants (new tables aren't exposed to the API automatically in this project)
-- ---------------------------------------------------------------------------

grant select on
  public.cities,
  public.settings,
  public.artists,
  public.artist_affinity,
  public.venues,
  public.events,
  public.event_artists,
  public.sale_windows,
  public.schedule_items
to anon, authenticated;

grant update (current_city_id) on public.settings to authenticated;
grant insert, delete on public.schedule_items to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.is_owner() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Starting data
-- ---------------------------------------------------------------------------

insert into public.cities (id, name, time_zone, latitude, longitude) values
  ('san-francisco', 'San Francisco', 'America/Los_Angeles', 37.7749, -122.4194),
  ('new-york', 'New York', 'America/New_York', 40.7128, -74.0060);

insert into public.settings (current_city_id) values ('san-francisco');
