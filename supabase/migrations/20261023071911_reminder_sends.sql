-- Reminder emails already sent, so a repeated cron run never emails twice.
-- Each ticked drop gets one the evening before and one the morning of.
create table public.reminder_sends (
  sale_window_id uuid not null references public.sale_windows (id) on delete cascade,
  slot text not null check (slot in ('evening', 'morning')),
  sent_at timestamptz not null default now(),
  primary key (sale_window_id, slot)
);

-- No policies: only the secret key (the reminder job) can use it.
alter table public.reminder_sends enable row level security;

grant all on public.reminder_sends to service_role;
