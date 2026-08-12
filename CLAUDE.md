# Weekwebsite Intake & Backoffice

Werkafspraken voor het bouwen van dit project.

## Lees dit eerst

1. `PRD.md` — wat het product doet en voor wie
2. `SPEC.md` — schema, routes, architectuur
3. `supabase-schema.sql` — de migratie, klaar om uit te voeren
4. `questions.ts` — de formuliervragen als data, klaar om te gebruiken

Bouw niets voordat je die vier gelezen hebt. De belangrijkste beslissingen zijn al genomen en onderbouwd; wijk daar alleen van af als je een concreet probleem ziet, en zeg dat dan eerst.

---

## Wat dit is, in drie zinnen

Flits Digital verkoopt websites voor € 500, binnen zeven werkdagen online. Die zeven dagen halen lukt alleen als het bedrijfsmateriaal van de klant snel binnen is. Dit is het formulier waarmee dat gebeurt, plus de backoffice waarin het team de voortgang bewaakt.

De klant is een installateur of aannemer die dit op zijn telefoon invult, vaak met matige verbinding. Elke ontwerpkeuze volgt daaruit.

---

## Niet onderhandelbaar

Dit zijn geen voorkeuren maar eisen. Ga hier niet van afwijken.

1. **De service-key komt nooit in de browser.** Nooit een `NEXT_PUBLIC_`-voorvoegsel. Er zijn precies twee plekken waar hij gelezen wordt, en meer mogen het er niet worden:
   - `lib/supabase-admin.ts`, met `import 'server-only'` bovenaan. Importeer dat bestand nooit vanuit een client component.
   - `lib/admin-allowlist.ts`, zonder `server-only`. Dat kan niet anders: de middleware draait op de Edge-runtime, waar `server-only` niet importeerbaar is, en de tabel `admins` zit achter RLS. Deze module doet één ding — kijken of een e-mailadres op de lijst staat — en wordt alleen vanuit `middleware.ts` gebruikt.
2. **De klantkant heeft geen auth.** Toegang loopt via een niet-raadbare token in de URL. Geen inlog, geen wachtwoord, geen e-mailverificatie.
3. **Foto's worden in de browser verkleind vóór het uploaden.** Met `imageOrientation: 'from-image'`, anders staan iPhone-foto's op hun kant. De code staat in `SPEC.md` hoofdstuk 4.
4. **Alle zichtbare tekst is Nederlands**, je/jij-vorm, B1-niveau. Ook foutmeldingen, ook lege-staat-teksten, ook knoppen. Geen Engelse termen in de UI.
5. **Mobiel eerst voor de klantkant.** Ontwerp op 375 px breed en werk omhoog. Raakvlakken minimaal 48 px.
6. **RLS staat aan zonder policies.** Dat is bewust. Voeg geen policies toe; alle toegang loopt server-side.

---

## Conventies

- **TypeScript strict.** Geen `any` zonder een reden die je erbij zet.
- **Server components als standaard.** `'use client'` alleen waar je interactiviteit echt nodig hebt: de formulierstappen en de uploadcomponent.
- **Server actions voor mutaties in de backoffice.** Route handlers alleen voor de klantkant-API, want die wordt vanuit de browser aangeroepen.
- **Geen commentaar dat herhaalt wat de code doet.** Wel commentaar bij een niet-voor-de-hand-liggende keuze.
- **Bestandsnamen en variabelen in het Engels, UI-tekst in het Nederlands.** Houd die twee gescheiden: UI-teksten in `lib/copy.ts` of direct in de component, nooit vermengd met logica.
- **Geen nieuwe afhankelijkheden** zonder het te melden. De stack in `SPEC.md` is compleet.

---

## Bouwvolgorde

Bouw in deze volgorde en stop bij elk controlepunt. Na fase 3 heb je al iets werkends dat je op een telefoon kunt testen — dat is belangrijker dan alles tegelijk afmaken.

### Fase 1 — Fundament
- Next.js met App Router en TypeScript, Tailwind, shadcn/ui
- `supabase-schema.sql` uitvoeren, bucket `intake-files` aanmaken (privé)
- `lib/supabase-admin.ts` met `server-only`
- Omgevingsvariabelen zoals in `SPEC.md` hoofdstuk 7
- Design tokens uit `SPEC.md` hoofdstuk 9 in de Tailwind-config

**Klaar wanneer:** de app draait en er een verbinding met Supabase is die je kunt aantonen.

### Fase 2 — Het formulier zonder uploads
- `questions.ts` inlezen en per vraagtype een component maken: `text`, `textarea`, `tel`, `email`, `url`, `radio`
- `/i/[token]` met vijf stappen, voortgangsbalk, vooruit en terug
- `POST /api/intake/save` met automatisch opslaan
- Terugspringen naar `current_step` bij binnenkomst
- `new` → `in_progress` bij de eerste opslag

**Klaar wanneer:** je een rij handmatig in Supabase kunt aanmaken, de link opent, hem half invult, het tabblad sluit, terugkomt en op dezelfde stap staat.

### Fase 3 — Uploads
- `lib/compress.ts` precies zoals in `SPEC.md`
- Uploadcomponent: verkleinen, wachtrij van maximaal twee tegelijk, voortgang per bestand, opnieuw proberen, verwijderen, miniaturen
- `upload-url`, `file` en `DELETE file`
- WhatsApp-alternatief zichtbaar onder de uploadzone

**Klaar wanneer:** je op een échte telefoon, op 4G en niet op wifi, acht foto's hebt geüpload en ze in Supabase Storage ziet staan. Dit is de enige test die telt.

### Fase 4 — Verzenden
- `POST /api/intake/submit`: status, `submitted_at`, `deadline_at` op zeven **werk**dagen later
- n8n-webhook aanroepen met signed URLs van zeven dagen
- `/i/[token]/klaar` met de opleverdatum
- Na verzenden weigert `save` elke wijziging

**Klaar wanneer:** verzenden werkt, de webhook vuurt, en een tweede poging tot opslaan netjes wordt geweigerd.

### Fase 5 — Backoffice
- Supabase Auth met magic link, `middleware.ts` met sessie- én allowlist-controle op `admins`
- `/admin/klanten`: lijst met status, voortgang, dagen sinds laatste activiteit, filter en zoeken
- `/admin/klanten/nieuw`: aanmaken, token genereren, link tonen met kopieerknop
- `/admin/klanten/[id]`: gegevens, status wijzigen, notities, alle antwoorden overzichtelijk, fotogalerij met vergroting en downloadknop
- `/admin`: dashboard met de drie blokken uit `SPEC.md` hoofdstuk 6

**Klaar wanneer:** je een klant kunt aanmaken, de link kunt kopiëren, en na het invullen alle antwoorden en foto's kunt bekijken zonder in Supabase te hoeven kijken.

### Fase 6 — Afmaken
- Deploy naar Vercel, subdomein `intake.weekwebsite.nl` koppelen (alleen een CNAME toevoegen, niets aan nameservers of MX-records)
- Lege staten, laadtoestanden, foutafhandeling
- Opruimtaak voor concepten ouder dan zes maanden
- Nalopen op een echte telefoon

---

## Waar het misgaat

Dit zijn de dingen die in dit soort projecten fout gaan. Loop ze na voordat je iets klaar noemt.

| Valkuil | Wat je doet |
|---|---|
| iPhone-foto's staan op hun kant | `imageOrientation: 'from-image'` in `createImageBitmap` |
| Acht uploads tegelijk lopen vast | Wachtrij van maximaal twee gelijktijdig |
| Service-key lekt naar de browser | `import 'server-only'`, en controleer je bundel |
| Klant kan niet verzenden zonder foto's | Foto's zijn nooit verplicht |
| Oude tab overschrijft verzonden data | Statuscheck in elke update |
| Deadline valt in het weekend | Zeven **werk**dagen, niet zeven kalenderdagen |
| Backoffice open voor iedereen met een Supabase-account | Allowlist op `admins`, niet alleen een sessiecheck |
| Alles werkt op je laptop | Testen op een telefoon op mobiel internet |

---

## Wat je niet bouwt

Klantportaal · facturatie · contracten · CRM-koppeling · rechtenbeheer · e-mails vanuit de app · meertaligheid · automatische herinneringen · een mooie backoffice.

Zie hoofdstuk 6 van de PRD. Als je denkt dat iets hiervan toch nodig is, zeg het — bouw het niet stiekem.

---

## Als je vastloopt

Vraag het, in plaats van te gokken. Concreet: als de vraagteksten of het statusmodel niet lijken te kloppen met de praktijk, is dat waarschijnlijk terecht en is het beter om het te bespreken dan om er zelf iets van te maken. Datzelfde geldt voor de exacte huisstijlkleuren — die staan in `SPEC.md` als schatting uit de advertentieontwerpen en moeten nog geverifieerd worden in Webflow.
