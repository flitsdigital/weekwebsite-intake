-- ============================================================
-- Weekwebsite Intake & Backoffice — initieel schema
-- Project: weekwebsite (Supabase, regio eu-central-1)
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- intakes
-- ------------------------------------------------------------
create table public.intakes (
  id                uuid primary key default gen_random_uuid(),
  token             text not null unique,

  -- klantgegevens, ingevuld door het team bij aanmaken
  company_name      text not null,
  contact_name      text,
  email             text,
  phone             text,

  -- procesvelden
  status            text not null default 'new'
                    check (status in ('new','in_progress','submitted','building','review','live','cancelled')),
  notes             text,
  slot_date         date,
  deadline_at       date,
  last_reminder_at  timestamptz,

  -- het formulier
  answers           jsonb not null default '{}'::jsonb,
  current_step      int  not null default 1,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  started_at        timestamptz,
  submitted_at      timestamptz
);

create index intakes_token_idx   on public.intakes (token);
create index intakes_status_idx  on public.intakes (status);
create index intakes_created_idx on public.intakes (created_at desc);

-- ------------------------------------------------------------
-- intake_files
-- ------------------------------------------------------------
create table public.intake_files (
  id             uuid primary key default gen_random_uuid(),
  intake_id      uuid not null references public.intakes(id) on delete cascade,
  kind           text not null check (kind in ('logo','photo','other')),
  storage_path   text not null,
  original_name  text,
  bytes          int,
  width          int,
  height         int,
  created_at     timestamptz not null default now()
);

create index intake_files_intake_idx on public.intake_files (intake_id);

-- ------------------------------------------------------------
-- admins — allowlist voor de backoffice
-- ------------------------------------------------------------
create table public.admins (
  email      text primary key,
  name       text,
  created_at timestamptz not null default now()
);

-- Vul hier de e-mailadressen van het team in:
-- insert into public.admins (email, name) values
--   ('jouw@flitsdigital.nl', 'Jordi');

-- ------------------------------------------------------------
-- updated_at automatisch bijwerken
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger intakes_touch
before update on public.intakes
for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- Zeven werkdagen vooruit rekenen (voor deadline_at)
-- ------------------------------------------------------------
create or replace function public.add_working_days(start_date date, days int)
returns date language plpgsql immutable as $$
declare
  d date := start_date;
  added int := 0;
begin
  while added < days loop
    d := d + 1;
    if extract(isodow from d) < 6 then   -- 1..5 = maandag t/m vrijdag
      added := added + 1;
    end if;
  end loop;
  return d;
end $$;

-- ------------------------------------------------------------
-- RLS: aan, bewust zonder policies.
-- Alle toegang loopt server-side via de service-key, die RLS omzeilt.
-- Met de publieke anon-key kan niemand lezen of schrijven.
-- ------------------------------------------------------------
alter table public.intakes      enable row level security;
alter table public.intake_files enable row level security;
alter table public.admins       enable row level security;

-- ------------------------------------------------------------
-- Storage: doe dit in de Supabase-interface
-- ------------------------------------------------------------
-- Bucket:  intake-files
-- Publiek: nee
-- Limiet:  10 MB per bestand
-- Types:   image/jpeg, image/png, image/webp, image/svg+xml, application/pdf
-- ------------------------------------------------------------
