-- ============================================================
-- Weekwebsite Intake — trechter en afhaakredenen
-- Draai dit ná supabase-schema.sql. Eén keer, in de SQL-editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Nieuwe kolommen
-- ------------------------------------------------------------
alter table public.intakes
  add column if not exists opened_at                 timestamptz,
  add column if not exists max_step_reached          int not null default 1,
  add column if not exists stall_reason              text,
  add column if not exists last_customer_activity_at timestamptz;

comment on column public.intakes.opened_at is
  'Eerste keer dat de klant /i/[token] opende. Wordt vanuit de browser gezet, niet '
  'bij het renderen: WhatsApp en iMessage halen links vooraf op voor een voorbeeldje '
  'en zouden dit anders vullen op het moment dat wij de link versturen.';

comment on column public.intakes.max_step_reached is
  'Hoogste stap die de klant ooit bereikte. Gaat alleen omhoog. current_step is een '
  'verplaatsbare aanwijzer — springt iemand van 4 terug naar 2, dan is dit nog 4.';

comment on column public.intakes.stall_reason is
  'Met de hand ingevuld door het team na telefonisch contact. De software ziet waar '
  'iemand stopt, nooit waarom.';

comment on column public.intakes.last_customer_activity_at is
  'Laatste actie van de klant zelf. updated_at verspringt ook bij een notitie of '
  'statuswijziging van het team en is daarom onbruikbaar voor "dagen stil".';

-- ------------------------------------------------------------
-- 2. Afhaakredenen — feitelijk formuleren, de klant mag ze opvragen
-- ------------------------------------------------------------
alter table public.intakes
  drop constraint if exists intakes_stall_reason_check;

alter table public.intakes
  add constraint intakes_stall_reason_check check (
    stall_reason is null or stall_reason in (
      'geen_fotos',
      'geen_tijd',
      'wacht_op_ander',
      'te_veel_gedoe',
      'onbereikbaar',
      'overig'
    )
  );

-- ------------------------------------------------------------
-- 3. Backfill — zodat de trechter niet vanaf nul begint
-- ------------------------------------------------------------

-- Wie begonnen is met invullen, heeft de link zeker geopend. Zonder deze regel
-- zou de trechter minder "geopend" dan "begonnen" tellen, wat onmogelijk is.
update public.intakes
set opened_at = started_at
where opened_at is null
  and started_at is not null;

-- Verzenden is een actie van de klant en het exacte tijdstip is bekend. Is er wel
-- begonnen maar niet verzonden, dan is updated_at de beste schatting die er is.
-- Nooit begonnen blijft leeg: er is dan geen klantactiviteit om te noteren.
update public.intakes
set last_customer_activity_at = coalesce(
      submitted_at,
      case when started_at is not null then updated_at end
    )
where last_customer_activity_at is null;

-- De hoogste stap uit wat er al ligt. De veldnamen hieronder zijn gegenereerd uit
-- lib/questions.ts, zodat de stapindeling niet met de hand is overgetypt.
-- Stap 3 telt apart mee via intake_files: logo en foto's staan niet in `answers`,
-- dus wie wel uploadde maar de radiovraag oversloeg zou anders stap 3 missen.
update public.intakes i
set max_step_reached = greatest(
  i.current_step,
  case
    when btrim(coalesce(i.answers->>'domein', '')) <> ''
         or btrim(coalesce(i.answers->>'domein_provider', '')) <> ''
         or btrim(coalesce(i.answers->>'email_locatie', '')) <> ''
         or btrim(coalesce(i.answers->>'google_reviews', '')) <> ''
         or btrim(coalesce(i.answers->>'socials', '')) <> ''
      then 5
    when btrim(coalesce(i.answers->>'voorbeeldsites', '')) <> ''
         or btrim(coalesce(i.answers->>'sfeer', '')) <> ''
         or btrim(coalesce(i.answers->>'kleuren', '')) <> ''
      then 4
    when btrim(coalesce(i.answers->>'social_fotos', '')) <> ''
      then 3
    when btrim(coalesce(i.answers->>'diensten', '')) <> ''
         or btrim(coalesce(i.answers->>'hoofddienst', '')) <> ''
         or btrim(coalesce(i.answers->>'zoekwoorden', '')) <> ''
      then 2
    else 1
  end,
  case
    when exists (select 1 from public.intake_files f where f.intake_id = i.id)
      then 3
    else 1
  end
);

-- Een verzonden intake is per definitie helemaal doorlopen.
update public.intakes
set max_step_reached = 5
where submitted_at is not null
  and max_step_reached < 5;

-- ------------------------------------------------------------
-- 4. max_step_reached laten bewaken door de database
-- ------------------------------------------------------------
-- Anders moet elk schrijfpad eraan denken: de opslagroute, het slepen op het
-- bord, een handmatige correctie. Eén trigger dekt ze allemaal, en de kolom kan
-- per definitie niet meer omlaag.
create or replace function public.keep_max_step()
returns trigger language plpgsql as $$
begin
  new.max_step_reached := greatest(coalesce(new.max_step_reached, 1), new.current_step);
  return new;
end $$;

drop trigger if exists intakes_max_step on public.intakes;

create trigger intakes_max_step
before insert or update on public.intakes
for each row execute function public.keep_max_step();

-- ------------------------------------------------------------
-- 5. Controle — draai dit los en kijk of het klopt
-- ------------------------------------------------------------
-- select company_name, status, current_step, max_step_reached,
--        opened_at is not null as geopend,
--        last_customer_activity_at, stall_reason
-- from public.intakes
-- order by created_at;
