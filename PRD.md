# PRD — Weekwebsite Intake & Backoffice

**Product:** `start.weekwebsite.nl`
**Opdrachtgever:** Flits Digital
**Status:** klaar om te bouwen
**Laatste update:** augustus 2026

---

## 1. Waarom dit er komt

Flits Digital verkoopt **Weekwebsite**: een website voor € 500 eenmalig plus € 50 per maand, binnen zeven werkdagen online. Die zeven dagen zijn een operationele belofte, geen marketingclaim.

Op dit moment is er geen intakeproces. De zeven dagen halen staat of valt bij één ding: **hoe snel het bedrijfsmateriaal binnen is** — teksten, foto's, logo, domeingegevens. Nu gebeurt dat via losse mailtjes en WhatsApp, wat betekent dat elke opdracht dagen kan uitlopen op iets simpels als acht foto's.

Daarnaast heeft Flits Digital geen overzicht: welke klant zit waar in het proces, wie wacht al vier dagen op materiaal, welke oplevering komt eraan.

Dit product lost beide op.

### Waarom zelf bouwen en niet Tally of Typeform

1. **Het is een demo van het werk.** De klant heeft net € 500 betaald aan een webbureau. Het eerste wat hij daarna gebruikt is dit formulier. Een strak formulier op het eigen domein bevestigt de keuze; een gratis formulier met vreemde branding ondermijnt hem.
2. **Het wordt bij elke klant gebruikt.** De bouwtijd is eenmalig, het gebruik oneindig.
3. **De backoffice kan er niet bij.** Voortgang bewaken, statussen bijhouden en foto's bekijken is geen formuliertaak.

---

## 2. Gebruikers

| Rol | Wie | Wat hij doet |
|---|---|---|
| **Klant** | Zzp'er of kleine ondernemer in Drenthe/Groningen. Installateur, hovenier, aannemer, garagehouder. Vaak niet digitaal vaardig. Vult dit in op zijn telefoon, geregeld met matige verbinding. | Vult éénmalig het intakeformulier in via een persoonlijke link. Logt nooit in. |
| **Team Flits Digital** | Twee personen. | Maakt klanten aan, stuurt links, bewaakt voortgang, bekijkt antwoorden en foto's, houdt statussen bij. |

### Wat we over de klant aannemen

- Vult in op een telefoon, niet op een laptop
- Heeft een hekel aan schrijven — het verhaaldeel is al aan de telefoon opgehaald
- Maakt het formulier niet in één keer af
- Heeft foto's op zijn telefoon, geen professionele fotografie
- Haakt af bij elke stap die onduidelijk voelt

Deze aannames sturen elke ontwerpkeuze in dit document.

---

## 3. Wat het product moet doen

### 3.1 Het intakeformulier (klantkant)

**Doel:** binnen tien minuten alle feiten en het beeldmateriaal binnen hebben, zonder dat de klant hoeft na te denken.

- Toegang via een unieke, niet-raadbare link — **geen account, geen wachtwoord**
- Vijf stappen: bedrijf, aanbod, beeldmateriaal, smaak, techniek
- Naam en bedrijfsnaam zijn al ingevuld
- Antwoorden worden automatisch bewaard; hij kan later verder op een ander apparaat
- Foto's worden in de browser verkleind vóór het uploaden
- Doorgaan zonder foto's moet kunnen, met een duidelijk alternatief
- Na verzenden: bevestiging met de opleverdatum

**Expliciet niet gevraagd:** wat het bedrijf uniek maakt, zelf aangeleverde teksten, gewenste paginastructuur. Dat is respectievelijk telefoonwerk, verkoopargument en vakmanschap.

### 3.2 De backoffice (teamkant)

**Doel:** in één oogopslag zien waar elke opdracht staat, en niets laten liggen.

| Functie | Waarom |
|---|---|
| Klant aanmaken en de intakelink genereren | Nu handwerk in de database |
| Klantgegevens aanpassen | Namen en nummers kloppen niet altijd meteen |
| Overzicht met status en voortgang | Voorkomt dat opdrachten stil blijven liggen |
| Zien hoeveel dagen iemand al niet reageert | Bepaalt wanneer je herinnert en wanneer je de plek weggeeft |
| Alle antwoorden overzichtelijk lezen | Startpunt voor de bouw |
| Foto's bekijken en downloaden | Nu de grootste bron van heen-en-weer |
| Status handmatig bijwerken | De bouwfase gebeurt buiten het systeem |
| Notities per klant | Losse afspraken uit telefoongesprekken |
| Opleverdatum en resterende dagen | Bewaakt de belofte van zeven dagen |

---

## 4. Het statusmodel

De statussen volgen het echte proces, niet een technische abstractie.

```
new ──────────► in_progress ──► submitted ──► building ──► review ──► live
(aangemaakt,    (klant is      (intake      (wij         (preview   (site staat
 link verstuurd) begonnen)      compleet,    bouwen)      verstuurd) online)
                                dag 0)
                     │
                     └──► cancelled  (plek weggegeven of afgehaakt)
```

- `new` → `in_progress` gebeurt automatisch zodra de klant de eerste stap opslaat
- `in_progress` → `submitted` gebeurt automatisch bij verzenden. **Dit is dag nul**: hier wordt `deadline_at` gezet op zeven werkdagen later
- Alles daarna zet het team handmatig in de backoffice

---

## 5. Hoe we succes meten

| Wat | Doel |
|---|---|
| Tijd tussen link versturen en intake compleet | Minder dan 48 uur |
| Percentage dat het formulier afmaakt | Boven 80% |
| Opdrachten die de zeven dagen halen | Boven 90% |
| Aantal keer dat materiaal nagevraagd moet worden | Minder dan één per opdracht |
| Tijd die het team kwijt is aan intake per klant | Minder dan tien minuten |

---

## 6. Buiten scope

Bewust niet in versie 1, om te voorkomen dat dit een maandenproject wordt:

- Klantportaal waar de klant zijn project kan volgen
- Facturatie of betalingen
- Contractondertekening
- Koppeling met Moneybird of een CRM
- Meerdere teamleden met verschillende rechten
- E-mails versturen vanuit de app (dat doet n8n)
- Meertaligheid
- Automatische herinneringen (v1 laat alleen zien wie er wacht; het versturen doet een mens)

---

## 7. Randvoorwaarden

- **Taal:** alles in het Nederlands, je/jij-vorm, B1-niveau. Ook de foutmeldingen.
- **Mobiel eerst.** De klantkant wordt vrijwel uitsluitend op een telefoon gebruikt.
- **AVG:** data in de EU, privé opslag, een bewaartermijn en een privacyverklaring waar het formulier naar verwijst.
- **Uiterlijk:** sluit aan op weekwebsite.nl. Geel, zwart, gebroken wit. De backoffice mag functioneler zijn dan mooi.

---

## 8. De belangrijkste risico's

| Risico | Wat we doen |
|---|---|
| **Foto-uploads mislukken op mobiel internet** | Verkleinen in de browser, uploaden in een wachtrij, per bestand opnieuw proberen, en altijd een WhatsApp-alternatief zichtbaar |
| Klant maakt het formulier niet af | Automatisch bewaren, vijf korte stappen, backoffice laat zien wie blijft hangen |
| Service-key lekt naar de browser | Alleen server-side gebruiken, nooit met een `NEXT_PUBLIC_`-voorvoegsel |
| Project wordt te groot en komt nooit af | Alles in hoofdstuk 6 valt buiten scope. Eerst laten werken, daarna verfraaien |
