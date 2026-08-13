-- ============================================================
-- Weekwebsite — contactmomenten
-- Draai dit ná supabase-migration-notes.sql. Opnieuw draaien kan geen kwaad.
--
-- Een contactmoment IS een notitie met een kanaal en een uitkomst. Geen
-- aparte tabel: één tijdlijn waarin sommige regels een gesprek zijn en
-- andere een losse aantekening. Zie CONTEXT.md.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Twee velden op notes
-- ------------------------------------------------------------
alter table public.notes
  add column if not exists channel text,
  add column if not exists outcome text;

alter table public.notes drop constraint if exists notes_channel_check;
alter table public.notes drop constraint if exists notes_outcome_check;
alter table public.notes drop constraint if exists notes_contact_compleet;

alter table public.notes
  add constraint notes_channel_check check (
    channel is null or channel in ('telefoon','whatsapp','mail','langsgeweest')
  );

alter table public.notes
  add constraint notes_outcome_check check (
    outcome is null or outcome in (
      'gesproken','niet_opgenomen','voicemail','teruggebeld','afspraak','verstuurd'
    )
  );

-- Allebei ingevuld of allebei leeg. Zo is "is dit een contactmoment"
-- één vraag met één antwoord, in plaats van een halve toestand.
alter table public.notes
  add constraint notes_contact_compleet check (
    (channel is null) = (outcome is null)
  );

comment on column public.notes.channel is
  'Ingevuld maakt deze notitie een contactmoment. Leeg is een losse aantekening.';

create index if not exists notes_lead_contact_idx
  on public.notes (lead_id, created_at) where channel is not null;

-- ------------------------------------------------------------
-- 2. Geschiedenis maken van de twee tijdstempels die er al staan
-- ------------------------------------------------------------
-- Eerst de eerste poging...
insert into public.notes (lead_id, body, author, created_at, channel, outcome)
select l.id, 'Belpoging, overgezet uit de oude tijdstempels', 'migratie',
       l.first_attempt_at, 'telefoon',
       case when l.status = 'gesproken' then 'gesproken' else 'niet_opgenomen' end
from public.leads l
where l.first_attempt_at is not null
  and not exists (
    select 1 from public.notes n
    where n.lead_id = l.id and n.author = 'migratie' and n.created_at = l.first_attempt_at
  );

-- ...en de laatste, als die een ander moment was.
insert into public.notes (lead_id, body, author, created_at, channel, outcome)
select l.id, 'Belpoging, overgezet uit de oude tijdstempels', 'migratie',
       l.last_attempt_at, 'telefoon',
       case when l.status = 'gesproken' then 'gesproken' else 'niet_opgenomen' end
from public.leads l
where l.last_attempt_at is not null
  and l.last_attempt_at is distinct from l.first_attempt_at
  and not exists (
    select 1 from public.notes n
    where n.lead_id = l.id and n.author = 'migratie' and n.created_at = l.last_attempt_at
  );

-- ------------------------------------------------------------
-- 3. 'niet_bereikt' verdwijnt als leadstatus
-- ------------------------------------------------------------
-- Het is de uitkomst van één poging, niet de toestand van de lead. Wie je
-- tevergeefs belde staat weer op 'nieuw' — maar met zijn pogingen erbij, dus
-- het Vandaag-scherm behandelt hem niet meer als onontdekt.
update public.leads set status = 'nieuw' where status = 'niet_bereikt';

alter table public.leads drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check check (
    status in ('nieuw','gesproken','afspraak','gewonnen','verloren')
  );

-- ------------------------------------------------------------
-- 4. De tijdstempels laten bijhouden door de database
-- ------------------------------------------------------------
-- Anders moet elk schrijfpad eraan denken, en verwijderen van een contactmoment
-- zou de reactietijd stil laten staan op een moment dat niet meer bestaat.
create or replace function public.sync_lead_attempts()
returns trigger language plpgsql as $$
declare
  doel uuid := coalesce(new.lead_id, old.lead_id);
begin
  if doel is not null then
    update public.leads l
    set first_attempt_at = (
          select min(n.created_at) from public.notes n
          where n.lead_id = doel and n.channel is not null
        ),
        last_attempt_at = (
          select max(n.created_at) from public.notes n
          where n.lead_id = doel and n.channel is not null
        )
    where l.id = doel;
  end if;
  return null;
end $$;

drop trigger if exists notes_sync_attempts on public.notes;

create trigger notes_sync_attempts
after insert or update or delete on public.notes
for each row execute function public.sync_lead_attempts();

-- Eén keer goedzetten voor wat er nu staat.
update public.leads l
set first_attempt_at = (
      select min(n.created_at) from public.notes n where n.lead_id = l.id and n.channel is not null
    ),
    last_attempt_at = (
      select max(n.created_at) from public.notes n where n.lead_id = l.id and n.channel is not null
    );

-- ------------------------------------------------------------
-- Controle
-- ------------------------------------------------------------
-- select l.company_name, l.contact_name, l.status, l.first_attempt_at,
--        count(n.id) filter (where n.channel is not null) as contactmomenten
-- from public.leads l left join public.notes n on n.lead_id = l.id
-- group by l.id order by l.received_at desc;
