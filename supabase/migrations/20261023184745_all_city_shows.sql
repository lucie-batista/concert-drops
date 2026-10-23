-- The refresh now keeps every music show in the city, not just my artists',
-- so the taste quiz has the whole city to recommend from. My page still only
-- shows events flagged has_my_artists.
alter table public.events
  add column has_my_artists boolean not null default false,
  add column genre text,                       -- Ticketmaster genre, e.g. 'Rock'
  add column subgenre text,                    -- e.g. 'Indie Rock'
  add column image_url text,
  -- Everyone on the bill, headliner first: [{ "id": "K8vZ9...", "name": "Ashe" }]
  add column performers jsonb not null default '[]';

-- Until now only events with my artists were saved.
update public.events e
  set has_my_artists = exists (
    select 1 from public.event_artists ea where ea.event_id = e.id
  );

create index events_city_id_has_my_artists_idx
  on public.events (city_id, has_my_artists, local_date);
