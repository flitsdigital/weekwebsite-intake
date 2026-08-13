-- ============================================================
-- Weekwebsite — waar een lead vandaan komt
-- Draai dit ná supabase-migration-leads.sql. Opnieuw draaien kan geen kwaad.
-- ============================================================

alter table public.leads
  add column if not exists source text not null default 'onbekend';

create index if not exists leads_source_idx on public.leads (source);

comment on column public.leads.source is
  'Kanaal: website, facebook, handmatig, onbekend — of een nieuwe waarde. '
  'Bewust zonder check-constraint: een kanaal dat we nog niet kennen mag nooit '
  'een lead kosten. De app labelt wat hij herkent en toont de rest zoals hij is.';

-- ------------------------------------------------------------
-- Backfill uit wat er al in `raw` staat
-- ------------------------------------------------------------
update public.leads
set source = case
  when raw->>'bron' ilike '%handmatig%'                        then 'handmatig'
  when raw->>'bron' ilike '%weekwebsite%'
    or raw->>'bron' ilike '%website%'
    or raw->>'bron' ilike '%intake-modal%'                     then 'website'
  when raw->>'bron' ilike '%facebook%'                         then 'facebook'
  when raw ? 'leadgen_id' or raw ? 'Lead ID' or raw ? 'lead_id' then 'facebook'
  when external_id is not null                                 then 'facebook'
  else 'onbekend'
end
where source = 'onbekend';

-- ------------------------------------------------------------
-- Controle
-- ------------------------------------------------------------
-- select source, count(*) from public.leads group by source order by 2 desc;
