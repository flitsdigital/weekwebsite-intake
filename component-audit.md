# Component Audit — Weekwebsite Intake & Backoffice

_21 componentbestanden gescand op 12 augustus 2026. Drempels: duplicaten ≥ 0,72 · inline ≥ 0,65 · min. 6 tokens (en een tweede ronde op 0,85 / 0,80)._

## Samenvatting

Bij de standaarddrempels vond de scanner **niets**. Losser afgesteld kwam er één kandidaat uit, en die houdt geen stand.

De echte duplicatie zit op een plek waar een structuurscanner per definitie niet komt: er zijn **geen atomen om tegen te vergelijken**. Er is geen `Button`, geen `Input`, geen `Card` in `components/` — die vormen bestaan alleen als klassenreeksen die per bestand opnieuw zijn opgeschreven. De scanner zoekt naar "rauwe `<button>` waar een `<Button>` bestaat" en vindt niets, omdat het tweede deel ontbreekt.

Eén bevinding is het oppakken waard. De rest is bewust uitstel.

| | Aantal | Oordeel |
|---|---|---|
| Duplicaatclusters | 0 | — |
| Inline herbouw | 1 gemeld | vals positief |
| Herbouwde primitieven | 0 gemeld | scanner kan het niet zien; handmatig 3 patronen gevonden |

---

## Vals positief — niet oppakken

### `app/page.tsx` zou herbouwd zijn in `app/admin/login/page.tsx` (dekking 0,75)

Beide zijn een `<main>` met gecentreerde inhoud, en `app/page.tsx` is acht regels lang. Bij een losse drempel lijkt bijna elk klein bestand op elk ander klein bestand. Het ene is de publieke stub voor wie zonder token binnenkomt, het andere is het inlogformulier. Geen relatie.

---

## Gemiste hergebruik — het paneel met icoonkop

**Dit is de enige bevinding die ik zou oppakken.**

De detailpagina heeft een lokale `Card`: een omkaderd vlak met een kop van icoon plus titel en een body eronder. Precies dezelfde koptekstregel staat nog twee keer met de hand uitgeschreven op het dashboard.

- `app/admin/(shell)/klanten/[id]/page.tsx:286` — de definitie van `Card`, privé aan dat bestand
- `app/admin/(shell)/page.tsx:96` — "Vraagt om aandacht", met de hand
- `app/admin/(shell)/page.tsx:122` — "Deadlines die eraan komen", met de hand

De klassenreeks van de kop is in alle drie **byte-identiek**:

```
flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-semibold
```

**Voorstel.** Verplaats `Card` naar `components/card.tsx` en gebruik hem op het dashboard. Zes gebruiken op de detailpagina blijven werken, twee handgebouwde blokken verdwijnen.

**Eén detail dat je moet regelen, anders wordt het lelijker in plaats van beter.** `Card` stopt zijn kinderen in een `p-5`. De dashboardpanelen hebben juist een lijst die tot aan de rand loopt (`divide-y`, geen padding), zodat rijen over de volle breedte oplichten bij hover. Een rechttoe-rechtaan vervanging geeft die lijsten dus ongewenste marge. `Card` heeft een schakelaar nodig — `padded={false}` of een aparte `<CardList>` — voordat de omzetting klopt.

**Niet meenemen:** het trechterblok in `components/funnel.tsx` gebruikt `<details>`/`<summary>` om in en uit te klappen. Dat is ander gedrag, geen variant van dezelfde kaart. Laat staan.

---

## Gemiste hergebruik — voortgangsbalkjes

Vier stuks, en ze zijn **niet hetzelfde**:

| Waar | Klassen | Verschil |
|---|---|---|
| `bord/board.tsx:84` | `h-1 flex-1 … bg-line` | dun, rekt mee |
| `klanten/page.tsx:129` | `h-1.5 w-16 … bg-line` | vaste breedte in een tabelcel |
| `i/[token]/upload.tsx:192` | `h-1 w-4/5 … bg-white/30` | op een donkere overlay, andere spoorkleur |
| `components/funnel.tsx:47` | `h-5 flex-1 … rounded bg-bg` | vijf keer zo hoog, andere ronding |

**Oordeel: niet samenvoegen.** Alleen de eerste twee lijken echt op elkaar; de andere twee verschillen in hoogte, spoorkleur én ronding. Eén component die alle vier aankan heeft props voor hoogte, breedte, spoor, vulling en ronding — dan is er niets meer over dat de component zélf beslist. Dat is een slechtere ruil dan vier keer twee regels Tailwind.

Als je toch iets wilt: trek alleen `bord` en `klanten` samen, dat scheelt één kopie. Weinig winst.

---

## Herhaalde klassenreeksen — bewust laten liggen

| Patroon | Aantal | Bestanden |
|---|---|---|
| `rounded-ww border border-line bg-white` (kaartomhulsel) | 18× | 11 |
| `mx-auto w-full max-w-5xl px-6 py-8 lg:px-10` (paginabody) | 4× | 4 |
| Primaire knop | 3× | 3 |
| Invoerveld | 3× | 3 |

Bovendien wordt in drie bestanden een lokale `const field` / `const primary` / `const secondary` opnieuw gedeclareerd.

**Oordeel: nog niet.** Dit is dezelfde conclusie als de architectuurreview van vorige week ("Speculatief — het rapport adviseerde het te laten liggen"), en er is sindsdien niets veranderd dat die weging omgooit. Het is dubbel werk, maar het veroorzaakt geen defecten en niemand struikelt erover.

Het moment om het wél te doen is scherp aan te wijzen: **de eerste keer dat je een stijl op vijf plekken moet nadoen**, of zodra shadcn/ui alsnog binnenkomt. Dan bouw je `Button`, `Input` en `Page` in één keer en heb je meteen de scanner aan je kant — want dan pas kan die "rauwe `<button>` waar een `<Button>` bestaat" melden.

---

## Volgorde van werken

1. **`Card` naar `components/`, met een `padded`-schakelaar** — en dan de twee dashboardpanelen omzetten. Bescheiden klus, en het dashboard is het scherm dat je dagelijks opent.
2. Verder niets. De rest van de lijst is bewust uitstel, geen achterstand.

## Wat deze audit niet dekt

De scanner vergelijkt structuur en klassennamen, niet gedrag. Twee componenten met identieke opmaak maar heel ander gedrag zien er hetzelfde uit — daarom is elke bevinding hierboven met de hand nagelopen in de betreffende bestanden. Andersom geldt ook: gedeelde *logica* valt buiten beeld. Die kant is gedekt door de architectuurreview, en de modules in `lib/` zijn daar al uit voortgekomen.
