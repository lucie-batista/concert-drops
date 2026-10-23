-- The most listened-to artists in the US, from Last.fm, replaced by each daily
-- refresh. The Popular page shows drops for shows with these artists.
create table public.popular_artists (
  rank integer primary key check (rank > 0),   -- 1 = most listened to
  name text not null,
  listeners bigint,
  updated_at timestamptz not null default now()
);

alter table public.popular_artists enable row level security;
create policy "Anyone can read popular artists" on public.popular_artists
  for select using (true);

grant select on public.popular_artists to anon, authenticated;
grant all on public.popular_artists to service_role;

-- The best (lowest) popular_artists rank among a show's performers, or null
-- when nobody on the bill is in the list.
alter table public.events add column popular_rank integer;

create index events_city_id_popular_rank_idx
  on public.events (city_id, popular_rank)
  where popular_rank is not null;
