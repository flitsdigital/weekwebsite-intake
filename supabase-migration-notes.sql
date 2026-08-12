-- ============================================================
-- Weekwebsite — notities als logboek
-- Draai dit ná supabase-migration-leads.sql. Opnieuw draaien kan geen kwaad.
--
-- Een notitie is een gedateerde regel, geen document dat je overschrijft.
-- Zie CONTEXT.md: je leest ze terug om te weten wat er wannéér gezegd is.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Inhaalslag: eerdere versie van de leadmigratie miste deze kolom
-- ------------------------------------------------------------
alter table public.leads add column if not exists first_attempt_at timestamptz;

comment on column public.leads.first_attempt_at is
  'Eerste belpoging. Hier hangt de reactietijd aan — de eigen regel is "bel '
  'binnen 5 minuten". Een tweede belletje mag dat getal niet oppoetsen, '
  'daarom staat de laatste poging apart.';

-- ------------------------------------------------------------
-- 1. De notities zelf
-- ------------------------------------------------------------
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),

  -- Precies één van de twee. Een notitie hoort bij een lead óf bij een intake,
  -- nooit bij allebei en nooit bij niets.
  lead_id    uuid references public.leads(id)   on delete cascade,
  intake_id  uuid references public.intakes(id) on delete cascade,

  body       text not null check (btrim(body) <> ''),
  author     text,

  created_at timestamptz not null default now(),

  constraint notes_one_owner check (num_nonnulls(lead_id, intake_id) = 1)
);

create index if not exists notes_lead_idx   on public.notes (lead_id, created_at desc);
create index if not exists notes_intake_idx on public.notes (intake_id, created_at desc);

comment on table public.notes is
  'Logboek. Regels worden toegevoegd, niet bewerkt: een notitie van vorige '
  'maand verandert niet meer. Bij verkoop verhuizen de notities van de lead '
  'mee naar de intake.';

-- ------------------------------------------------------------
-- 2. Het oude notitieveld wordt de eerste regel in het logboek
-- ------------------------------------------------------------
insert into public.notes (intake_id, body, author, created_at)
select i.id, btrim(i.notes), 'overgezet uit het oude notitieveld', i.updated_at
from public.intakes i
where btrim(coalesce(i.notes, '')) <> ''
  and not exists (
    select 1 from public.notes n
    where n.intake_id = i.id
      and n.author = 'overgezet uit het oude notitieveld'
  );

comment on column public.intakes.notes is
  'Vervangen door de tabel notes. De inhoud is overgezet als eerste regel in '
  'het logboek; deze kolom blijft staan zodat er niets verloren gaat, maar '
  'wordt niet meer gelezen of geschreven.';

-- ------------------------------------------------------------
-- 3. RLS aan, bewust zonder policies
-- ------------------------------------------------------------
alter table public.notes enable row level security;

-- ------------------------------------------------------------
-- Controle
-- ------------------------------------------------------------
-- select count(*) filter (where lead_id is not null)   as bij_leads,
--        count(*) filter (where intake_id is not null) as bij_intakes
-- from public.notes;
