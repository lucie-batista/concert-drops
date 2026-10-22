-- Presales often come with sign-up instructions, e.g. "Sign into Ticketmaster with
-- the same email you use for All Access to unlock the presale."
alter table public.sale_windows add column description text;
