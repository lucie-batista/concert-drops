-- Cities can come from search, so each one keeps its GeoNames id (from the
-- Open-Meteo geocoder), a region and country for display, and when its shows
-- were last loaded.
alter table public.cities
  add column geoname_id integer unique,
  add column region text,
  add column country_code text,
  add column refreshed_at timestamptz;

update public.cities
  set geoname_id = 5391959, region = 'California', country_code = 'US'
  where id = 'san-francisco';
update public.cities
  set geoname_id = 5128581, region = 'New York', country_code = 'US'
  where id = 'new-york';

-- San Francisco was loaded by the daily refresh.
update public.cities
  set refreshed_at = (
    select max(finished_at) from public.refresh_runs where status = 'succeeded'
  )
  where id = 'san-francisco';
