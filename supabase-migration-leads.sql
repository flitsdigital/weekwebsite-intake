-- ============================================================
-- Weekwebsite — leads (de verkoopfase vóór de intake)
-- Draai dit ná supabase-schema.sql. Opnieuw draaien kan geen kwaad.
--
-- Zie docs/adr/0002: een Lead en een Intake zijn twee dingen. Bij verkoop
-- ontstaat er een Intake en blijft de Lead bestaan op 'gewonnen'.
-- ============================================================

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),

  -- Het lead-id van Facebook. Uniek, zodat een herhaalpoging van Zapier geen
  -- tweede rij maakt. Leeg bij leads die je met de hand invoert.
  external_id     text unique,

  company_name    text,
  contact_name    text,
  phone           text,
  email           text,

  -- De hele oorspronkelijke payload. Verandert het Facebook-formulier, dan ben
  -- je niets kwijt en hoef je de Zap niet opnieuw te bouwen om te zien wat er kwam.
  raw             jsonb not null default '{}'::jsonb,

  status          text not null default 'nieuw'
                  check (status in ('nieuw','niet_bereikt','gesproken','afspraak','gewonnen','verloren')),

  -- Eén datum. De status vertelt wat hij betekent: bij 'niet_bereikt' opnieuw
  -- bellen, bij 'afspraak' de afspraak zelf.
  next_action_at   date,

  -- Twee tijdstippen, met opzet. De eerste poging is het getal dat de conversie
  -- voorspelt ("bel binnen 5 minuten"); de laatste vertelt hoe warm het nog is.
  first_attempt_at timestamptz,
  last_attempt_at  timestamptz,

  lost_reason     text
                  check (lost_reason is null or lost_reason in (
                    'te_duur','heeft_al_site','wil_zelf_bouwen','niet_bereikt','geen_interesse','overig'
                  )),

  received_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Voor het geval de tabel al bestond van een eerdere versie van dit bestand.
alter table public.leads add column if not exists first_attempt_at timestamptz;

create index if not exists leads_status_idx      on public.leads (status);
create index if not exists leads_next_action_idx on public.leads (next_action_at);
create index if not exists leads_received_idx    on public.leads (received_at desc);

comment on column public.leads.external_id is
  'Lead-id van Facebook. Uniek voor het herkennen van dubbele inzendingen; '
  'leeg bij handmatig ingevoerde leads.';

comment on column public.leads.next_action_at is
  'Wanneer jij weer iets moet doen. Nooit meer dan één tegelijk; de status '
  'bepaalt wat de datum betekent.';

-- ------------------------------------------------------------
-- De verwijzing van Intake naar Lead
-- ------------------------------------------------------------
-- Eén richting. De teruglink (lead -> intake) leiden we hieruit af; twee
-- kolommen die naar elkaar wijzen kunnen uit de pas gaan lopen. Zie ADR 0002.
alter table public.intakes
  add column if not exists lead_id uuid references public.leads(id) on delete set null;

create index if not exists intakes_lead_idx on public.intakes (lead_id);

comment on column public.intakes.lead_id is
  'De lead waaruit deze intake is voortgekomen, als die er is. Gegevens zijn '
  'bij verkoop gekopieerd, niet gedeeld: de lead blijft het verslag van het '
  'verkoopgesprek.';

-- ------------------------------------------------------------
-- updated_at, met dezelfde functie als intakes
-- ------------------------------------------------------------
drop trigger if exists leads_touch on public.leads;

create trigger leads_touch
before update on public.leads
for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- RLS aan, bewust zonder policies — alle toegang loopt server-side
-- ------------------------------------------------------------
alter table public.leads enable row level security;

-- ------------------------------------------------------------
-- Controle
-- ------------------------------------------------------------
-- select status, count(*) from public.leads group by status order by 1;
