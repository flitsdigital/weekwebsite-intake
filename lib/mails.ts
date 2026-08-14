import { formatLongDate } from './dates';

export type Mail = {
  id: string;
  title: string;
  hint?: string;
  subject?: string;
  body: string;
};

type Input = {
  companyName: string;
  contactName: string | null;
  intakeUrl: string;
  deadline: string | null;
  signer: string;
  phone: string | null;
};

/**
 * De vijf mails uit het productiesysteem, met de gegevens die we al hebben
 * ingevuld. Wat we niet weten blijft tussen haken staan — dat is zichtbaar
 * onaf, en dat is beter dan een gokje dat de klant leest.
 */
export function mailsFor({
  companyName,
  contactName,
  intakeUrl,
  deadline,
  signer,
  phone,
}: Input): Mail[] {
  const naam = contactName?.split(' ')[0] || companyName;
  const datum = formatLongDate(deadline) ?? '[datum]';
  const nummer = phone ?? '[nummer]';

  return [
    {
      id: 'bevestiging',
      title: '1 — Bevestiging na het ja-gesprek',
      hint: 'Binnen tien minuten sturen. Voeg het A4, de voorwaarden en de machtiging bij.',
      subject: 'Je Weekwebsite — dit zijn de vervolgstappen',
      body: `Hoi ${naam},

Fijn dat we elkaar net spraken. Hierbij alles op een rij, dan kun je het rustig teruglezen.

Wat je krijgt
In de bijlage staat precies wat er in het pakket zit, wat het kost en wat er niet in zit. Ook de overeenkomst zit erbij.

Wat ik van jou nodig heb
Vul dit formulier in: ${intakeUrl}

Het duurt ongeveer tien minuten. De foto's zijn het meeste werk — en je telefoonfoto's zijn prima, daar maken wij iets moois van.

De planning
Zodra je formulier en je foto's binnen zijn, gaan we van start. Vanaf dat moment staat je site binnen zeven werkdagen online. Vul je het morgen in, dan sta je ${datum} live.

De betaling
De € 500 betaal je pas als je site klaar is en jij hem hebt gezien. Voor het maandbedrag van € 50 zit er een machtiging bij.

Akkoord geven
Klopt alles? Stuur deze mail dan even terug met "akkoord", dan is het geregeld. Je hoeft niets te printen of te scannen.

Loop je ergens tegenaan? Bel of app me gerust op ${nummer}.

Groet,
${signer}
Flits Digital`,
    },
    {
      id: 'herinnering-2',
      title: '2 — Herinnering na twee dagen',
      hint: 'Als WhatsApp sturen, niet als mail. Werkt bij deze doelgroep beter.',
      body: `Hoi ${naam}, loop je ergens tegenaan met het formulier? Bel me gerust even, dan lopen we het samen door — duurt tien minuten. Zodra het binnen is gaan we van start.`,
    },
    {
      id: 'herinnering-4',
      title: '2b — Herinnering na vier dagen',
      hint: 'Andere bewoordingen dan dag twee, anders leest het als een automaat.',
      body: `Hoi ${naam}, ik hou nog even een plek voor je vrij deze week. Zullen we het formulier samen doorlopen? Zeg maar wanneer het uitkomt, dan bel ik je.`,
    },
    {
      id: 'preview',
      title: '3 — De preview op dag vier',
      hint: 'Zet de preview-link erin voordat je verstuurt.',
      subject: 'Je website staat klaar — kijk je even mee?',
      body: `Hoi ${naam},

Je site is klaar om te bekijken: [preview-link]

Loop 'm rustig door, ook even op je telefoon. Kijk vooral of je gegevens kloppen, of je diensten er goed op staan, en of je jezelf erin herkent.

Stuur alles wat je wilt aanpassen in één bericht terug. Dan verwerk ik het morgen in één keer. Dat is precies de reden dat we die zeven dagen halen.

Groet,
${signer}`,
    },
    {
      id: 'oplevering',
      title: '4 — Oplevering',
      hint: 'Vraag de review nu, niet over twee weken. Nu is hij het meest tevreden.',
      subject: 'Je website staat online',
      body: `Hoi ${naam},

Hij staat live: [url]

Wat er nu gebeurt
Google heeft een paar dagen tot een paar weken nodig om je site goed op te pikken. Dat gaat vanzelf, daar hoef je niets voor te doen.

Wat wij blijven doen
Hosting, beveiliging, back-ups en updates. Gaat er iets kapot, dan lossen we dat op. Twee kleine tekstwijzigingen per maand zitten erbij — app ze gewoon door naar ${nummer}.

Eén verzoek
Als je tevreden bent: zou je ons een review willen geven? [reviewlink]

Eén zin is al genoeg, en je helpt ons er enorm mee.

En mag ik je site gebruiken als voorbeeld in ons portfolio?

Groet,
${signer}`,
    },
    {
      id: 'dertig-dagen',
      title: '5 — Na dertig dagen',
      hint: 'Liever bellen. Lukt dat niet, dan dit als appje.',
      body: `Hoi ${naam}, je site staat nu een maand online. Hoe bevalt het — komen er een beetje aanvragen binnen? Ik hoor het graag, en als er iets is wat beter kan hoor ik dat ook.`,
    },
  ];
}
