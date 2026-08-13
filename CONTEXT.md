# Domeintaal — Weekwebsite

De woorden die we in dit project gebruiken, en wat ze precies betekenen. Geen
implementatie, geen besluiten — alleen taal. Als code en dit document elkaar
tegenspreken, is dat een fout die uitgesproken moet worden.

## Lead

Iemand die belangstelling heeft getoond, meestal via een Facebook-formulier, en
nog **niets betaald heeft**. Een lead heeft geen intakelink, geen opleverdatum en
geen belofte van zeven werkdagen. De meeste leads worden nooit klant.

Een lead is **niet** hetzelfde als een Intake. Ze delen een bedrijfsnaam en een
telefoonnummer, en verder niets.

## Intake

Het aanleverproces van één klant die **wel** betaald heeft: het formulier, de
antwoorden, het beeldmateriaal, en de status daarvan. Begint bij `new`
("aangemaakt, link verstuurd") en eindigt bij `live` of `cancelled`.

De belofte van zeven werkdagen hangt aan de Intake, niet aan de Lead.

## Klant

Een bedrijf dat betaald heeft. In de backoffice heet het scherm "Klanten" en dat
toont Intakes — nooit Leads. Een lead die je aan de telefoon hebt is dus geen
klant, hoe kansrijk hij ook is.

## Verkocht

Het moment waarop een Lead een Intake **wordt**. Dit is de enige overgang tussen
de twee, en hij gaat één kant op: een Intake wordt nooit weer een Lead.

## Contactmoment

Een poging om iemand te bereiken, met wat eruit kwam. Legt vast: wanneer, via
welk kanaal (telefoon, WhatsApp, mail, langsgeweest), en de uitkomst — gesproken,
niet opgenomen, voicemail ingesproken, teruggebeld gekregen, of afspraak gemaakt.

Een contactmoment **is een Notitie** met die twee velden ingevuld. Er is geen
aparte lijst: één tijdlijn per lead of klant, waarin sommige regels een gesprek
zijn en andere een losse aantekening.

## Nog niet gebeld

Betekent: er is nog **geen enkel contactmoment**. Dit is geen status maar iets
wat je afleidt. Een lead die je drie keer tevergeefs belde is dus wél benaderd,
ook al heb je hem nooit gesproken — die hoort niet bovenaan alsof je hem nog
moet ontdekken.

## Volgende actie

Eén datum per Lead: wanneer jij weer iets moet doen. De status vertelt wat die
datum betekent — bij *niet bereikt* is het "opnieuw bellen", bij *afspraak* is
het de afspraak zelf. Er is nooit meer dan één volgende actie tegelijk.

## Verloren

Een Lead waar je mee stopt, altijd met een reden uit een vaste lijst. Feitelijk
geformuleerd, niet waarderend — het is een aantekening over een persoon.

## Notitie

Een **gedateerde regel** die je erbij typt, nooit een document dat je
overschrijft. Notities zijn een logboek: je leest ze terug om te weten wat er
wannéér gezegd is. Een notitie van vorige maand verandert niet meer.

Een notitie met een kanaal en een uitkomst is een [Contactmoment]; zonder die
twee is het een losse aantekening. Beide staan in dezelfde tijdlijn.

Leads en Intakes hebben dezelfde soort notities, zodat ze bij *verkocht*
gewoon meeverhuizen.

## Dag nul

De dag waarop de klant zijn intake verzendt. Hier gaat de teller van zeven
werkdagen lopen. Niet de dag van verkoop, niet de dag waarop de link verstuurd is.

## Aandacht nodig

Een Intake waar **wij op de klant wachten** en waar meer dan twee werkdagen geen
activiteit van die klant is geweest. Statussen waarin wij aan zet zijn tellen
niet mee, hoe lang ze ook stilstaan.

## Klantactiviteit

Iets dat de klant zelf deed: een antwoord opslaan, een bestand uploaden,
verzenden. Een notitie of statuswijziging van het team is **geen**
klantactiviteit — anders lijkt een stille klant weer actief.
