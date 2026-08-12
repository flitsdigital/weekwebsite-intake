# Lead en Intake zijn twee entiteiten, geen één levensloop

Een Lead (belangstelling, niets betaald) en een Intake (betaald, aanleverproces loopt) krijgen elk een eigen tabel. Bij verkoop *wordt* een Lead een Intake: er ontstaat een nieuwe rij, de Lead blijft bestaan met status `gewonnen` en de Intake verwijst naar hem terug.

Het voor de hand liggende alternatief was één tabel met een langere levensloop (`lead → gesproken → verkocht → new → … → live`). Dat is afgewezen om twee redenen. De bestaande intaketrechter meet "van link naar verzonden"; gooi je leads in dezelfde verzameling, dan gaat datzelfde percentage ineens iets anders meten en wordt een aanleverprobleem onzichtbaar achter je conversie. En praktisch: van tien leads worden er misschien twee klant, dus acht rijen zouden elk klantenscherm vervuilen — inclusief "wacht op materiaal", dat dan mensen telt die nergens op wachten.

## Consequenties

De verwijzing staat op de Intake en wijst naar de Lead. De teruglink wordt daaruit afgeleid, niet apart opgeslagen: twee kolommen die naar elkaar wijzen kunnen uit de pas gaan lopen.

Er zijn twee trechters, met *verkocht* als scharnier. Eén gecombineerd getal is bewust niet gebouwd.

Gegevens die bij verkoop meeverhuizen (bedrijfsnaam, contactpersoon, telefoon, e-mail, notities) worden **gekopieerd**, niet gedeeld. Verandert een naam later op de Intake, dan verandert de Lead niet mee. Dat is gewenst: de Lead is een historisch verslag van het verkoopgesprek.
