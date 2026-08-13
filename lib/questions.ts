/**
 * De intakevragen als data.
 *
 * Verhaalvragen (wat maakt jullie uniek, waarom jij) staan hier bewust NIET in.
 * Die worden telefonisch opgehaald tijdens het verkoopgesprek — de doelgroep
 * schrijft niet graag, en die vragen zorgen voor dagen vertraging.
 */

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'tel'
  | 'email'
  | 'url'
  | 'radio'
  | 'upload'
  /** Toont alleen tekst, slaat niets op. Voor een geruststelling bij een keuze. */
  | 'info';

export interface Question {
  key: string;
  type: QuestionType;
  label: string;
  help?: string;
  required?: boolean;
  options?: string[];
  /** alleen voor type 'upload' */
  kind?: 'logo' | 'photo';
  min?: number;
  max?: number;
  placeholder?: string;
  /**
   * Toon deze vraag alleen als een eerder antwoord precies deze waarde heeft.
   * Bewust één sleutel en één waarde: meer dan dat hebben we niet nodig, en
   * een expressietaal is niet te overzien in een formulier van vijf stappen.
   */
  showIf?: { key: string; equals: string };
}

export interface Step {
  id: string;
  title: string;
  subtitle?: string;
  questions: Question[];
}

export const STEPS: Step[] = [
  {
    id: 'bedrijf',
    title: 'Je bedrijf',
    subtitle: 'Even de basis, dat is zo gebeurd',
    questions: [
      {
        key: 'bedrijfsnaam',
        type: 'text',
        label: 'Hoe heet je bedrijf, precies zoals het op de site moet komen?',
        required: true,
      },
      {
        key: 'adres',
        type: 'text',
        label: 'Wat is je bezoekadres?',
        help: 'Werk je vanuit huis en wil je je adres liever niet online? Vul dan alleen je plaats in.',
      },
      {
        key: 'telefoon',
        type: 'tel',
        label: 'Welk telefoonnummer mag op de site?',
        required: true,
      },
      {
        key: 'email',
        type: 'email',
        label: 'Welk e-mailadres mag op de site?',
        required: true,
      },
      {
        key: 'kvk',
        type: 'text',
        label: 'Wat is je KvK-nummer?',
        help: 'Die zetten we onderaan de site. Klanten en Google vinden dat prettig.',
      },
      {
        key: 'openingstijden',
        type: 'text',
        label: 'Wanneer ben je bereikbaar?',
        placeholder: 'ma t/m vr 8:00–17:00, zaterdag op afspraak',
      },
      {
        key: 'werkgebied',
        type: 'textarea',
        label: 'In welke plaatsen werk je?',
        help: 'Noem er gerust vijf tot tien. Hier zoeken mensen op — "loodgieter Assen" levert meer op dan alleen "loodgieter".',
        required: true,
      },
    ],
  },

  {
    id: 'aanbod',
    title: 'Wat je aanbiedt',
    subtitle: 'Kort mag, we hoeven niet alles op te noemen',
    questions: [
      {
        key: 'diensten',
        type: 'textarea',
        label: 'Welke diensten of producten bied je aan?',
        help: 'Eén per regel. Drie tot zes is genoeg.',
        required: true,
      },
      {
        key: 'hoofddienst',
        type: 'text',
        label: 'Waar wil je het liefst op gevonden worden?',
        help: 'Als iemand er maar één ding van je onthoudt, wat moet dat dan zijn?',
      },
      {
        key: 'zoekwoorden',
        type: 'text',
        label: 'Waar zouden klanten in Google op zoeken om jou te vinden?',
        placeholder: 'dakkapel plaatsen Emmen, kozijnen vervangen Drenthe',
      },
    ],
  },

  {
    id: 'beeld',
    title: 'Beeldmateriaal',
    subtitle: 'Foto’s van je telefoon zijn prima — daar maken wij iets moois van',
    questions: [
      {
        key: 'logo',
        type: 'upload',
        kind: 'logo',
        label: 'Upload je logo',
        help: 'Het liefst als AI-, EPS- of SVG-bestand. Heb je alleen een JPG of PNG? Stuur die gerust.',
        max: 1,
      },
      {
        key: 'fotos',
        type: 'upload',
        kind: 'photo',
        label: 'Upload foto’s van je werk, je team en je materieel',
        help: 'Denk aan: drie van afgerond werk, twee van jezelf of je team aan het werk, één van je bus of pand. Hoe echter, hoe beter — stockfoto’s herkent iedereen.',
        min: 6,
        max: 30,
      },
      {
        key: 'social_fotos',
        type: 'radio',
        label: 'Mogen we ook foto’s van je Google-profiel of social media gebruiken?',
        options: ['Ja, prima', 'Nee, liever niet'],
      },
    ],
  },

  {
    id: 'smaak',
    title: 'Smaak',
    subtitle: 'Dit scheelt ons straks een hoop heen en weer',
    questions: [
      {
        key: 'voorbeeldsites',
        type: 'textarea',
        label: 'Noem twee of drie websites die je mooi vindt',
        help: 'Mogen ook uit een heel andere branche zijn. Zet er in één zin bij wat je er goed aan vindt.',
      },
      {
        key: 'sfeer',
        type: 'radio',
        label: 'Welke sfeer past het beste bij jullie?',
        options: [
          'Strak en zakelijk',
          'Stoer en robuust',
          'Warm en persoonlijk',
          'Modern en speels',
        ],
      },
      {
        key: 'kleuren',
        type: 'text',
        label: 'Heb je vaste huisstijlkleuren?',
        help: 'Weet je de kleurcodes niet? Geen probleem, dan halen we ze uit je logo.',
      },
    ],
  },

  {
    id: 'techniek',
    title: 'Techniek',
    subtitle: 'Bijna klaar — dit voorkomt gedoe bij het live zetten',
    questions: [
      {
        key: 'heeft_domein',
        type: 'radio',
        label: 'Heb je al een domeinnaam?',
        required: true,
        options: ['Ja', 'Nee, nog niet', 'Weet ik niet'],
      },
      {
        key: 'domein',
        type: 'text',
        label: 'Wat is je domeinnaam?',
        placeholder: 'kievitafbouw.nl',
        showIf: { key: 'heeft_domein', equals: 'Ja' },
      },
      {
        key: 'domein_provider',
        type: 'text',
        label: 'Bij welke partij staat je domeinnaam?',
        help: 'Bijvoorbeeld TransIP, Hostnet, Strato of Antagonist. Weet je het niet zeker? Vul "weet ik niet" in, dan zoeken wij het op.',
        showIf: { key: 'heeft_domein', equals: 'Ja' },
      },
      {
        key: 'domein_wens',
        type: 'text',
        label: 'Welke domeinnaam zou je willen hebben?',
        help: 'Nog niet zeker? Vul in wat je in gedachten hebt, dan kijken wij of hij vrij is.',
        showIf: { key: 'heeft_domein', equals: 'Nee, nog niet' },
      },
      {
        key: 'domein_onbekend',
        type: 'info',
        label: 'Geen probleem, dat zoeken wij uit.',
        help: 'We bellen je hierover voordat we je site live zetten. Je hoeft nu niets in te vullen.',
        showIf: { key: 'heeft_domein', equals: 'Weet ik niet' },
      },
      {
        key: 'email_locatie',
        type: 'radio',
        label: 'Waar staat je zakelijke e-mail?',
        help: 'We vragen dit zodat je mail blijft werken als we je site live zetten.',
        required: true,
        options: [
          'Google Workspace of Gmail',
          'Microsoft 365 of Outlook',
          'Bij mijn domeinprovider',
          'Ik gebruik gmail.com of hotmail.com',
          'Weet ik niet',
        ],
      },
      {
        key: 'google_reviews',
        type: 'url',
        label: 'Heb je Google-reviews? Plak hier de link',
        help: 'Die zetten we op je site — dat scheelt bezoekers een zoektocht.',
      },
      {
        key: 'socials',
        type: 'text',
        label: 'Je Facebook, Instagram of LinkedIn',
      },
    ],
  },
];

/**
 * Is deze vraag zichtbaar bij deze antwoorden? Eén regel, gedeeld door het
 * formulier, de voortgangsberekening en de backoffice — anders telt de
 * voortgang velden mee die de klant nooit te zien krijgt en komt hij nooit
 * op honderd procent.
 */
export function isVisible(question: Question, answers: Record<string, unknown> | null): boolean {
  if (!question.showIf) return true;
  return String(answers?.[question.showIf.key] ?? '') === question.showIf.equals;
}

/** De vragen van een stap die nu getoond moeten worden. */
export function visibleQuestions(step: Step, answers: Record<string, unknown> | null): Question[] {
  return step.questions.filter((q) => isVisible(q, answers));
}

/** Verplichte velden die bij deze antwoorden ook echt zichtbaar zijn. */
export function requiredKeys(answers: Record<string, unknown> | null): string[] {
  return STEPS.flatMap((s) =>
    s.questions.filter((q) => q.required && isVisible(q, answers)).map((q) => q.key)
  );
}

export const TOTAL_STEPS = STEPS.length;
