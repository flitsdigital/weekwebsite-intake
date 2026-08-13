-- ============================================================
-- Weekwebsite — de domeinvraag krijgt een ja/nee/weet-ik-niet
-- Draai dit ná de eerdere migraties. Opnieuw draaien kan geen kwaad.
--
-- 'domein' en 'domein_provider' worden nu alleen getoond als er "Ja" gekozen
-- is. Zonder deze backfill zouden bestaande antwoorden onzichtbaar worden in
-- de backoffice, want die past dezelfde zichtbaarheidsregel toe.
-- ============================================================

update public.intakes
set answers = answers || jsonb_build_object('heeft_domein', 'Ja')
where btrim(coalesce(answers->>'domein', '')) <> ''
  and coalesce(answers->>'heeft_domein', '') = '';

-- ------------------------------------------------------------
-- Controle
-- ------------------------------------------------------------
-- select company_name,
--        answers->>'heeft_domein' as keuze,
--        answers->>'domein'       as domein,
--        answers->>'socials'      as oude_socials
-- from public.intakes
-- order by created_at;
