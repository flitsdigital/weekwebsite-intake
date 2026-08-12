# Technische specificatie — Weekwebsite Intake & Backoffice

Hoort bij `PRD.md`. Dit document beschrijft *hoe*; de PRD beschrijft *wat en waarom*.

---

## 1. Stack

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Framework | **Next.js 15+, App Router, TypeScript** | Server actions voor mutaties, echte auth-middleware voor de backoffice |
| Database + opslag | **Supabase** (nieuw project `weekwebsite`, regio `eu-central-1`) | Postgres plus Storage, data blijft in de EU |
| Auth | **Supabase Auth**, alleen voor de backoffice | De klantkant heeft bewust geen auth |
| Hosting | **Vercel**, apart project | Losstaand van weekwebsite.nl zelf |
| Backoffice-UI | **shadcn/ui + Tailwind** | Snel bruikbaar, hoeft niet mooi |
| Klant-UI | **Tailwind met eigen tokens** | Moet aansluiten op weekwebsite.nl |

**Belangrijk onderscheid:** de klantkant is maatwerk en op de huisstijl. De backoffice is een gereedschapskist — daar telt snelheid van bouwen, niet schoonheid.

---

## 2. Datamodel

### 2.1 Tabellen

```sql
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- intakes
-- ─────────────────────────────────────────────
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
  slot_date         date,          -- geplande startweek
  deadline_at       date,          -- gezet bij submitted: 7 werkdagen later
  last_reminder_at  timestamptz,

  -- het formulier
  answers           jsonb not null default '{}'::jsonb,
  current_step      int  not null default 1,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  started_at        timestamptz,   -- eerste keer opgeslagen door de klant
  submitted_at      timestamptz
);

create index intakes_token_idx   on public.intakes (token);
create index intakes_status_idx  on public.intakes (status);
create index intakes_created_idx on public.intakes (created_at desc);

-- ─────────────────────────────────────────────
-- intake_files
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- admins — allowlist voor de backoffice
-- ─────────────────────────────────────────────
create table public.admins (
  email      text primary key,
  name       text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- updated_at bijhouden
-- ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger intakes_touch
before update on public.intakes
for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────
-- RLS: aan, bewust zonder policies.
-- Alle toegang loopt server-side via de service-key, die RLS omzeilt.
-- ─────────────────────────────────────────────
alter table public.intakes      enable row level security;
alter table public.intake_files enable row level security;
alter table public.admins       enable row level security;
```

### 2.2 Opslag

Bucket `intake-files`, **privé**.

| Instelling | Waarde |
|---|---|
| Publiek | Nee |
| Maximale bestandsgrootte | 10 MB |
| Toegestane types | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`, `application/pdf` |
| Pad | `{intake_id}/photos/{uuid}.jpg` · `{intake_id}/logo/{uuid}.{ext}` |

Geen storage-policies nodig: uploaden gaat via een signed upload URL die de server aanmaakt, downloaden via tijdelijke signed URLs.

### 2.3 Het `answers`-veld

Platte sleutel-waardeparen, sleutels komen overeen met `lib/questions.ts`.

```json
{
  "bedrijfsnaam": "Kuipers Installatie",
  "adres": "Hoofdstraat 12, Emmen",
  "telefoon": "0591 123456",
  "email": "info@kuipersinstallatie.nl",
  "kvk": "01234567",
  "openingstijden": "ma t/m vr 8:00-17:00",
  "werkgebied": "Emmen, Klazienaveen, Coevorden, Borger",
  "diensten": "CV-ketels\nVloerverwarming\nBadkamers",
  "hoofddienst": "CV-ketel vervangen",
  "zoekwoorden": "loodgieter emmen, cv ketel vervangen drenthe",
  "social_fotos": "Ja, prima",
  "voorbeeldsites": "...",
  "sfeer": "Stoer en robuust",
  "kleuren": "",
  "domein": "kuipersinstallatie.nl",
  "domein_provider": "TransIP",
  "email_locatie": "Microsoft 365 of Outlook",
  "google_reviews": "https://...",
  "socials": ""
}
```

---

## 3. Routes

### 3.1 Klantkant — geen auth

| Route | Wat |
|---|---|
| `GET /i/[token]` | Het formulier. Haalt `answers` en `current_step` op, springt terug naar waar de klant was. Onbekende token → 404. |
| `GET /i/[token]/klaar` | Bevestiging met opleverdatum. |

### 3.2 API — klantkant

| Route | Wat |
|---|---|
| `POST /api/intake/save` | `{ token, answers, step }`. Werkt alleen bij status `new` of `in_progress`. Zet `new` → `in_progress` en vult `started_at` bij de eerste keer. |
| `POST /api/intake/submit` | Status naar `submitted`, `submitted_at` = nu, `deadline_at` = 7 werkdagen later. Stuurt daarna de n8n-webhook. |
| `POST /api/intake/upload-url` | `{ token, filename, contentType, kind }` → signed upload URL plus het pad. Valideert het contenttype server-side. |
| `POST /api/intake/file` | Registreert het bestand in `intake_files` na een geslaagde upload. |
| `DELETE /api/intake/file` | `{ token, fileId }`. Verwijdert uit Storage én de tabel. |

Alle routes valideren de token server-side. Geen token = geen toegang.

### 3.3 Backoffice — auth verplicht

| Route | Wat |
|---|---|
| `GET /admin/login` | Magic link via Supabase Auth. |
| `GET /admin` | Dashboard: telling per status, wie er wacht, welke deadlines eraan komen. |
| `GET /admin/klanten` | Lijst met filter op status en zoeken op naam. |
| `GET /admin/klanten/nieuw` | Formulier om een klant aan te maken; toont daarna de intakelink met een kopieerknop. |
| `GET /admin/klanten/[id]` | Detail: gegevens, status, voortgang, alle antwoorden, fotogalerij, notities. |
| `POST` server actions | `createIntake`, `updateIntake`, `updateStatus`, `saveNotes`, `regenerateToken`, `deleteIntake`. |

### 3.4 Beveiliging van de backoffice

`middleware.ts` beschermt alles onder `/admin` behalve `/admin/login`:

1. Supabase-sessie aanwezig? Zo nee → `/admin/login`
2. Staat het e-mailadres in de tabel `admins`? Zo nee → uitloggen en terug naar login

Alleen een sessie hebben is dus niet genoeg. Iemand die zichzelf via Supabase Auth registreert komt er zonder rij in `admins` niet in.

---

## 4. Uploads

Het onderdeel met de meeste kans op problemen. Klanten zitten op mobiel internet en uploaden foto's van hun telefoon.

### 4.1 Verkleinen in de browser

Verplicht. Verandert een upload van 40 MB in ongeveer 4 MB.

```ts
// lib/compress.ts
export async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml') return file;

  let bitmap: ImageBitmap;
  try {
    // imageOrientation voorkomt dat staande telefoonfoto's gedraaid worden
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // bijvoorbeeld HEIC die de browser niet kan decoderen
  }

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, 'image/jpeg', quality)
  );
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
    type: 'image/jpeg',
  });
}
```

### 4.2 De uploadstroom

1. Klant kiest bestanden
2. Per bestand: verkleinen, miniatuur tonen, in de wachtrij zetten
3. **Maximaal twee tegelijk uploaden** — meer loopt vast op matig mobiel internet
4. `POST /api/intake/upload-url` → signed upload URL
5. Rechtstreeks uploaden naar Supabase Storage, met voortgang per bestand
6. `POST /api/intake/file` registreert de rij

### 4.3 Eisen aan de uploadcomponent

- Voortgang per bestand, plus een knop "opnieuw proberen" bij een fout
- Verwijderknop per foto met miniatuur
- Verzenden mag ook zonder foto's
- Onder de uploadzone: *"Lukt het uploaden niet? App ze naar [nummer]."*
- Duidelijke helptekst: **telefoonfoto's zijn prima**

---

## 5. Automatisch opslaan

- Aanroepen bij elke stapwissel en met 800 ms vertraging tijdens typen
- Bij binnenkomst op `/i/[token]` terugspringen naar `current_step`
- Zichtbare geruststelling: *"Je antwoorden worden automatisch bewaard."*
- Na `submitted` weigert `save` elke wijziging

---

## 6. Voortgang meten

De backoffice berekent per intake:

| Veld | Berekening |
|---|---|
| Voortgang in procent | Ingevulde verplichte velden gedeeld door het totaal |
| Huidige stap | `current_step` van 5 |
| Dagen sinds aanmaken | `now - created_at` |
| Dagen sinds laatste activiteit | `now - updated_at` |
| Dagen tot oplevering | `deadline_at - now`, in werkdagen |
| Aandacht nodig | Status `new` of `in_progress` **en** meer dan 2 dagen geen activiteit |

Het dashboard toont bovenaan drie blokken: **wacht op materiaal**, **in aanbouw**, **deadline binnen 2 dagen**.

---

## 7. Omgevingsvariabelen

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # alleen voor Auth in de backoffice
SUPABASE_SERVICE_ROLE_KEY=          # NOOIT met NEXT_PUBLIC_

# App
NEXT_PUBLIC_APP_URL=https://intake.weekwebsite.nl
N8N_WEBHOOK_URL=
WHATSAPP_NUMBER=
```

> De service-key wordt uitsluitend gelezen in `lib/supabase-admin.ts`, en dat bestand mag nooit vanuit een client component geïmporteerd worden. Zet `import 'server-only'` bovenaan.

---

## 8. Notificatie bij verzenden

`POST /api/intake/submit` stuurt na het bijwerken van de status een bericht naar de n8n-webhook:

```json
{
  "intake": { "id": "...", "company_name": "...", "contact_name": "...",
              "phone": "...", "email": "...", "deadline_at": "2026-08-21",
              "answers": { }, "admin_url": "https://intake.weekwebsite.nl/admin/klanten/..." },
  "files": [ { "kind": "photo", "name": "IMG_1234.jpg",
               "url": "https://...signed...", "expires_in_days": 7 } ]
}
```

n8n maakt daar de opgemaakte mail van, gelijk aan de bestaande leadmelding.

---

## 9. Uiterlijk

Tokens overnemen uit Webflow. Onderstaande waarden zijn afgeleid uit de bestaande advertentieontwerpen — controleren in het stijlpaneel van weekwebsite.nl.

```css
:root {
  --ww-accent: #F5D312;   /* geel */
  --ww-ink:    #101014;   /* zwart */
  --ww-bg:     #F7F5F0;   /* gebroken wit */
  --ww-btn:    #2D7FF9;   /* knopblauw */
  --ww-line:   #E3E1DC;
  --ww-muted:  #6B6B78;
  --ww-radius: 10px;
}
```

Eisen aan de klantkant:

- Eén blokje vragen per scherm, met voortgangsbalk
- Raakvlakken minimaal 48 px hoog
- Keuzeopties als knoppen die meteen doorspringen
- Elke upload zichtbaar bevestigd met een miniatuur

---

## 10. Beveiliging

| Punt | Aanpak |
|---|---|
| Service-key | Alleen server-side, `import 'server-only'`, nooit `NEXT_PUBLIC_` |
| Token | Minimaal 20 tekens uit `crypto.randomUUID()`, niet oplopend |
| Bucket | Privé, alleen tijdelijke signed URLs |
| Verzonden intakes | Wijzigingen blokkeren met een statuscheck in de update |
| Bestandstypes | Server-side controleren, niet alleen in de browser |
| Backoffice | Sessie **en** allowlist in `admins` |
| Bewaartermijn | Opruimtaak: concepten ouder dan zes maanden verwijderen, inclusief bestanden |

---

## 11. Wat expliciet niet gebouwd wordt

Klantportaal · facturatie · contracten · CRM-koppeling · rechtenbeheer · e-mails vanuit de app · meertaligheid · automatische herinneringen.

Zie hoofdstuk 6 van de PRD.
