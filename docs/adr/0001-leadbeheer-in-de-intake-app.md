# Leadbeheer komt in de intake-app, niet in Flits Impact CRM

`CLAUDE.md` noemt onder *"Wat je niet bouwt"* expliciet **CRM-koppeling**, en PRD hoofdstuk 6 noemt *"Koppeling met Moneybird of een CRM"*. Er bestaat bovendien al een tweede systeem — Flits Impact CRM op `impact-orcin.vercel.app` — dat via `/api/assistant/briefing` al "stale leads" rapporteert. Toch bouwen we leadbeheer hier.

De reden: die twee systemen staan volgens de opdrachtgever los van elkaar, en het team wil één plek waar de weg van eerste contact tot opgeleverde site zichtbaar is. Het alternatief — leads in Flits Impact CRM houden en hier alleen tonen — is afgewezen omdat twee systemen die allebei leads bijhouden na een paar maanden niet meer te rijmen zijn.

## Consequenties

Dit is bewust een uitbreiding van de scope die in `CLAUDE.md` en de PRD staat. Wie later leest dat CRM-koppeling buiten scope viel en hier toch een `leads`-tabel vindt: dat is geen vergissing.

Er is geen synchronisatie met Flits Impact CRM, in geen van beide richtingen. Wordt die later toch gewenst, dan is dat een nieuw besluit — niet iets wat hieruit volgt.
