# Weekwebsite Intake & Backoffice

Het intakeformulier waarmee klanten van Flits Digital hun bedrijfsmateriaal
aanleveren, plus de backoffice waarin het team leads opvolgt en de voortgang
bewaakt.

## Lees dit eerst

| Bestand | Waarover |
|---|---|
| [PRD.md](PRD.md) | Wat het product doet en voor wie |
| [SPEC.md](SPEC.md) | Schema, routes, architectuur |
| [CLAUDE.md](CLAUDE.md) | Werkafspraken en wat niet gebouwd wordt |
| [CONTEXT.md](CONTEXT.md) | De domeintaal — Lead, Intake, Klant, Contactmoment |
| [docs/adr/](docs/adr/) | Besluiten die lastig terug te draaien zijn |

## Aan de praat krijgen

```bash
npm install
cp .env.local.example .env.local   # vul de waarden in
npm run dev
```

De migraties in `supabase-migration-*.sql` draai je in volgorde in de SQL-editor
van Supabase, na `supabase-schema.sql`. Ze zijn allemaal opnieuw te draaien.

```bash
npm test        # 85 tests, ingebouwde runner van Node — geen testafhankelijkheid
npm run build
```

## Hoe het in elkaar zit

De **klantkant** (`/i/[token]`) heeft bewust geen inlog: toegang loopt via een
niet-raadbare token in de URL. Vijf stappen, antwoorden worden onderweg bewaard,
foto's worden in de browser verkleind voordat ze geüpload worden.

De **backoffice** (`/admin`) zit achter een magic link én een allowlist in de
tabel `admins`. Alleen een sessie is niet genoeg.

De domeinregels wonen in `lib/` en zijn los van React en Supabase te testen —
de uploadwachtrij, de levensloop van een intake, de trechter, en wanneer een
lead aan de beurt is.
