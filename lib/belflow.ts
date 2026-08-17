/**
 * De belflow als data, net als `questions.ts`. Tekst met **sterretjes** wordt vet
 * weergegeven en een lege regel maakt een nieuwe alinea — geen HTML in de data,
 * zodat er nergens ruwe opmaak in de pagina hoeft te worden geïnjecteerd.
 */

export type Kind = 'vraag' | 'bezwaar' | 'doel' | 'info';
export type Tone = 'pos' | 'mid' | 'neg';

export type Option = { label: string; hint?: string; to: string; tone: Tone };

export type Step = {
  crumb: string;
  kind: Kind;
  step: string;
  say: string[];
  tip?: string;
  question?: string;
  options: Option[];
};

export type Ending = {
  crumb: string;
  outcome: 'good' | 'mid' | 'bad';
  step: string;
  title: string;
  list: string[];
};

export type Node = Step | Ending;

export function isEnding(node: Node): node is Ending {
  return 'outcome' in node;
}

export const START = 'start';

export const BELFLOW: Record<string, Node> = {
  start: {
    crumb: 'Start',
    kind: 'info',
    step: 'Voordat je belt: waar kwam deze lead vandaan?',
    say: [
      'Je hebt een mail gekregen met zijn gegevens, en hij staat al in je backoffice. Kijk even naar het veld **bron** — dat bepaalt wat hij al weet.',
    ],
    tip: '**Website-leads zijn warmer.** Die hebben de pagina gelezen: prijs, zeven dagen én de € 50 per maand staan daar. **Facebook-leads** hebben alleen je advertentie en het Expresformulier gezien. Daar staat de prijs wel in de intro, maar mensen scrollen daar overheen. Ga er niet vanuit.\n\n**Wat je bij een Facebook-lead al wél hebt:** naam, telefoon, e-mail, wat hij wil laten maken, wat voor werk hij doet en wanneer hij wil starten. Alleen zijn bedrijfsnaam vraag je niet uit — die haal je in het gesprek op.',
    question: 'Kies de bron',
    options: [
      {
        label: 'bron = website',
        hint: 'Formulier op weekwebsite.nl — hij kent de prijs',
        to: 'open_web',
        tone: 'pos',
      },
      {
        label: 'bron = facebook',
        hint: 'Expresformulier — prijskennis onzeker',
        to: 'open_fb',
        tone: 'mid',
      },
      {
        label: 'Hij neemt niet op',
        hint: 'Het meest voorkomende scenario bij advertenties',
        to: 'geen_gehoor',
        tone: 'mid',
      },
    ],
  },

  geen_gehoor: {
    crumb: 'Geen gehoor',
    kind: 'info',
    step: 'Drie pogingen, verspreid over de dag',
    say: [
      'Niet opnemen betekent bijna nooit "geen interesse". Het betekent meestal dat hij op een steiger staat of in de auto zit.',
    ],
    tip: '**Je belritme:**\nPoging 1 — binnen vijf minuten na de lead.\nPoging 2 — twee uur later, op een ander tijdstip van de dag.\nPoging 3 — de volgende ochtend voor negen uur, of tussen twaalf en één.\n\nNa poging 2 stuur je een appje: *"Hoi [naam], je vroeg net info aan over een website. Ik probeerde je te bellen — schikt het vanmiddag beter? Groet, [jouw naam] van Weekwebsite."*\n\nBellen met een nummer dat hij niet kent werkt slechter dan een app die zijn eigen aanvraag noemt. Die app is dus geen bijzaak.',
    question: 'Wat gebeurt er?',
    options: [
      { label: 'Hij neemt alsnog op', to: 'open_fb', tone: 'pos' },
      { label: 'Hij appt terug met een moment', to: 'end_terugbel', tone: 'pos' },
      { label: 'Drie pogingen, niets gehoord', to: 'end_geen_contact', tone: 'mid' },
    ],
  },

  open_web: {
    crumb: 'Opening',
    kind: 'vraag',
    step: 'Bellen binnen vijf minuten. Zijn antwoorden liggen voor je.',
    say: [
      'Hoi **[voornaam]**, je spreekt met **[jouw naam]** van Weekwebsite. Je vulde net het formulier in op onze site — bel ik gelegen?',
    ],
    tip: '**Noem Weekwebsite, niet Flits Digital.** Hij heeft op weekwebsite.nl gezeten; een andere bedrijfsnaam zorgt meteen voor verwarring.\n\nHij heeft trouwens net een automatische bevestigingsmail gekregen. Bel je binnen vijf minuten, dan is dat een prettig toeval: *"Je hebt net een bevestiging in je mail gekregen, en ik dacht: ik bel gewoon even."*',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Ja hoor, zeg het maar"', to: 'situatie', tone: 'pos' },
      { label: '"Nu even niet"', to: 'nietgelegen', tone: 'mid' },
      { label: '"Waar gaat dit over?"', to: 'herinneren', tone: 'mid' },
    ],
  },

  open_fb: {
    crumb: 'Opening',
    kind: 'vraag',
    step: 'Bellen binnen vijf minuten. Gebruik wat hij invulde.',
    say: [
      'Hoi **[voornaam]**, je spreekt met **[jouw naam]** van Weekwebsite. Je liet net via Facebook je gegevens achter — je gaf aan dat je **[wat hij invulde bij "wat wil je laten maken"]** zoekt. Bel ik gelegen?',
    ],
    tip: '**Noem zijn eigen antwoord terug.** Dat is het verschil tussen een telemarketeer en iemand die zijn aanvraag echt gelezen heeft. Het staat in je mail en in je backoffice, dus je hoeft niks te zoeken.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Ja hoor"', to: 'prijs_check', tone: 'pos' },
      { label: '"Nu even niet"', to: 'nietgelegen', tone: 'mid' },
      { label: '"Waar gaat dit over?"', to: 'herinneren', tone: 'mid' },
    ],
  },

  prijs_check: {
    crumb: 'Prijscheck',
    kind: 'doel',
    step: 'Alleen bij Facebook-leads. Doe dit vóórdat je investeert.',
    say: [
      'Even één ding vooraf, want dat wil ik niet halverwege ontdekken: het gaat om een site van **vijfhonderd euro**, binnen zeven werkdagen online, en daarna **vijftig euro per maand** voor hosting en onderhoud. Was dat duidelijk toen je je gegevens achterliet?',
    ],
    tip: '**Dit is nieuw ten opzichte van je websiteleads, en het is de belangrijkste toevoeging aan deze flow.** Een Expresformulier is in tien seconden ingevuld. Een deel van je leads heeft alleen een plaatje gezien en op een knop gedrukt.\n\nVraag je dit niet, dan voer je een gesprek van tien minuten met iemand die dacht dat het gratis was, en verlies je hem alsnog — maar dan later, en met meer moeite. Vraag je het wel, dan zit je binnen dertig seconden in het echte gesprek.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Ja, dat wist ik"', to: 'situatie', tone: 'pos' },
      { label: '"Vijftig per maand? Dat wist ik niet"', to: 'abo_onbekend', tone: 'mid' },
      { label: '"Vijfhonderd is meer dan ik dacht"', to: 'te_duur', tone: 'mid' },
      { label: '"Ik dacht dat het vrijblijvende info was"', to: 'perongeluk', tone: 'mid' },
    ],
  },

  // Hier komt hij binnen ná de prijscheck, waarin je de € 50 al genoemd hebt.
  // Daarom niet doorsturen naar `de_50`: die kondigt het bedrag aan, en dat
  // klinkt als niet luisteren tegen iemand die net zei dat hij verrast was.
  abo_onbekend: {
    crumb: 'Wist het niet',
    kind: 'bezwaar',
    step: 'Niet opnieuw aankondigen — uitleggen waar het geld heen gaat',
    say: [
      'Dan leg ik het even goed uit. Die vijftig euro is geen extra product dat erbij komt, dat is wat je site draaiend houdt: de hosting, de beveiliging, de back-ups en de updates. Gaat er iets kapot, dan bel je mij en los ik het op.',
      'Twee kleine tekstwijzigingen per maand zitten er ook bij. Je hebt dus geen aparte hostingpartij en geen losse rekeningen als er wat moet gebeuren.',
    ],
    tip: '**Hij is niet boos, hij is verrast.** Ga niet in de verdediging en herhaal je aankondiging niet — dan bevestig je juist het idee dat er iets verstopt zat. Vertel waar het geld heen gaat en laat hem reageren.\n\nZie je dit vaak terugkomen, dan zit het niet in je gesprek maar in je advertentie. Noteer het bij de lead.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Ah, zo werkt dat"', to: 'kwalificeren', tone: 'pos' },
      { label: '"Dus ik zit daaraan vast?"', to: 'bezwaar_50', tone: 'mid' },
      { label: '"Kan ik het niet zonder dat abonnement?"', to: 'zonder_abo', tone: 'mid' },
      { label: '"Alles bij elkaar is dat me te veel"', to: 'te_duur', tone: 'mid' },
    ],
  },

  nietgelegen: {
    crumb: 'Niet gelegen',
    kind: 'bezwaar',
    step: 'Nooit ophangen zonder nieuw moment',
    say: [
      'Geen probleem, ik hou je niet op. Schikt vanmiddag rond vier uur beter, of liever morgenochtend vroeg?',
    ],
    tip: 'Twee opties, geen open vraag. "Wanneer schikt het jou?" levert "ik laat het weten" op.',
    question: 'Wat zegt hij?',
    options: [
      { label: 'Hij kiest een moment', to: 'end_terugbel', tone: 'pos' },
      { label: '"Stuur maar wat info"', to: 'mailtje', tone: 'mid' },
      { label: '"Laat maar zitten"', to: 'end_nee', tone: 'neg' },
    ],
  },

  herinneren: {
    crumb: 'Herinneren',
    kind: 'vraag',
    step: 'Rustig, zonder verwijt',
    say: [
      'Je liet net je gegevens achter voor een website van vijfhonderd euro, binnen zeven dagen online — herken je dat?',
    ],
    tip: 'Door de prijs meteen te noemen, weet hij weer waar het over ging. Dat is precies wat hem aantrok. Bij een Facebook-lead is dit meteen je prijscheck.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Oh ja, klopt"', to: 'situatie', tone: 'pos' },
      { label: '"Dat was per ongeluk"', to: 'perongeluk', tone: 'mid' },
    ],
  },

  perongeluk: {
    crumb: 'Per ongeluk',
    kind: 'bezwaar',
    step: 'Eén kans om terug te komen',
    say: [
      "Ha, dat gebeurt — zo'n formulier op Facebook is zo ingevuld. Dan hou ik het kort: speelt er wel iets rond je website, of is het echt niet aan de orde?",
    ],
    tip: 'Bij Expresformulieren is dit vaker raak dan bij websiteformulieren. Dat is de prijs die je betaalt voor een lage drempel. Eén nette vraag, en dan laat je het los.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Nou ja, er speelt wel wat"', to: 'situatie', tone: 'pos' },
      { label: '"Nee, echt niet"', to: 'end_nee', tone: 'neg' },
    ],
  },

  situatie: {
    crumb: 'Situatie',
    kind: 'vraag',
    step: 'Kort. Je hoeft hier niet lang over te doen.',
    say: [
      'Wat heb je nu staan aan website?',
      'En wat maakt dat je er nú naar kijkt?',
      'Even voor mijn administratie: onder welke naam sta je ingeschreven?',
    ],
    tip: '**Die laatste vraag is nieuw.** Je Expresformulier vraagt geen bedrijfsnaam, en zonder die naam kun je geen intake aanmaken en geen bevestiging sturen. Vraag het losjes, ergens in het begin, dan hoef je er later niet op terug te komen.\n\nVerder is dit gesprek korter dan bij maatwerk. De prijs heeft het werk al gedaan. Je hoeft geen behoefte te creëren, je hoeft alleen te checken of het past.',
    question: 'Wat voor bedrijf en situatie is dit?',
    options: [
      { label: 'Verouderde site, wil iets simpels en nets', to: 'wat_krijg_je', tone: 'pos' },
      { label: 'Nog helemaal geen website', to: 'geen_site', tone: 'pos' },
      {
        label: 'Wil eigenlijk een webshop of iets groters',
        hint: 'Dit is geen Weekwebsite',
        to: 'maatwerk',
        tone: 'mid',
      },
      { label: '"Waarom is het zo goedkoop?"', to: 'waarom_goedkoop', tone: 'mid' },
      { label: '"Ik ken iemand die dat ook kan"', to: 'al_iemand', tone: 'mid' },
    ],
  },

  geen_site: {
    crumb: 'Geen site',
    kind: 'vraag',
    step: 'Vaak een starter — extra kansrijk',
    say: ['Hoe komen klanten nu bij je terecht?'],
    tip: 'Antwoord is meestal mond-tot-mond. Volg op met: *"En als iemand je naam doorkrijgt, wat vindt die dan als hij je googelt?"* Daar valt de stilte, en dan heb je je opening.',
    options: [
      { label: 'Hij ziet het punt', to: 'wat_krijg_je', tone: 'pos' },
      { label: '"Ik red me prima zonder"', to: 'end_later', tone: 'mid' },
    ],
  },

  al_iemand: {
    crumb: 'Kent iemand',
    kind: 'bezwaar',
    step: 'De zwager, de buurman, de neef die "wel wat met computers doet"',
    say: [
      'Dat hoor ik vaker, en soms is dat ook gewoon de beste route. Maar even eerlijk: staat die site er dan ook over twee weken?',
      'Want dat is meestal waar het misgaat. Niet omdat die persoon het niet kan, maar omdat het erbij komt naast zijn eigen werk. En als er over een half jaar iets kapotgaat, moet je hem weer bellen — en dan is hij druk.',
    ],
    tip: '**Niet afgeven op die ander.** Dat is vaak familie. Je concurreert niet op kunde maar op doorlooptijd en op wie er opneemt als het stukgaat. Dat is precies wat jouw € 50 per maand koopt.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Daar heb je een punt"', to: 'wat_krijg_je', tone: 'pos' },
      { label: '"Nee, ik regel het via hem"', to: 'end_later', tone: 'mid' },
    ],
  },

  maatwerk: {
    crumb: 'Maatwerk',
    kind: 'doel',
    step: 'Dit is geen verlies — dit is je grotere order',
    say: [
      'Dan is Weekwebsite eigenlijk niet wat je zoekt, en dat zeg ik liever nu dan achteraf. Een webshop of een systeem waar klanten in inloggen, dat is maatwerk.',
      'Daar hebben we een ander traject voor, onder onze eigen naam Flits Digital. Dat begint rond de **vijfentwintighonderd euro** en duurt een paar weken. Zal ik daarvoor een half uur inplannen, dan kijken we wat je precies nodig hebt?',
    ],
    tip: '**Eerlijk doorverwijzen levert je een grotere order op.** Iemand die een webshop wil en een Weekwebsite krijgt, wordt een ontevreden klant met een slechte review. Route hem omhoog.\n\nNoteer wel dat deze lead uit de Weekwebsite-campagne kwam. Als je advertenties maatwerkklanten opleveren, verandert je hele rekensom over wat een lead mag kosten.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Ja, doe maar"', to: 'end_maatwerk', tone: 'pos' },
      { label: '"Dat is me te duur, kan het niet simpeler?"', to: 'wat_krijg_je', tone: 'mid' },
      { label: '"Ik denk er nog over na"', to: 'end_later', tone: 'mid' },
    ],
  },

  waarom_goedkoop: {
    crumb: 'De catch',
    kind: 'bezwaar',
    step: 'De vraag achter de vraag: word ik hier genaaid?',
    say: [
      "Terechte vraag, en er zit geen adder onder het gras. Het zit zo: wij bouwen niet elke keer opnieuw het wiel uit. We hebben een vaste opzet die we invullen met jouw teksten, foto's en werk. Daardoor doen we in een week wat een bureau in drie maanden doet.",
      'Je krijgt minder keuzevrijheid dan bij maatwerk. Maar je krijgt wel een site die klopt, die op je telefoon werkt en waar je gevonden wordt. Voor de meeste bedrijven is dat precies genoeg.',
    ],
    tip: '**Niet defensief worden.** Leg het mechanisme uit — mensen accepteren een lage prijs zodra ze snappen waaróm hij laag kan zijn. En benoem eerlijk wat je inlevert; dat maakt de rest geloofwaardig.',
    options: [
      { label: '"Ah, logisch"', to: 'wat_krijg_je', tone: 'pos' },
      { label: '"Dus het is een template?"', to: 'is_template', tone: 'mid' },
    ],
  },

  is_template: {
    crumb: 'Template?',
    kind: 'bezwaar',
    step: 'Wees eerlijk over wat het wel en niet is',
    say: [
      "We werken met een vaste set bouwblokken, maar we zetten die per bedrijf anders in elkaar. Jouw kleuren, jouw foto's, jouw teksten, jouw diensten. Twee klanten van ons lijken niet op elkaar.",
      'Wat je niet krijgt is een compleet uniek ontwerp vanaf nul — daar begint maatwerk, en dat kost een veelvoud.',
    ],
    tip: 'Ontkennen dat er een systeem achter zit is een leugen die je later inhaalt. Uitleggen hoe het werkt maakt je juist geloofwaardig. Je hébt inmiddels een echte sectiebibliotheek — je kunt dit met droge ogen vertellen.',
    options: [
      { label: '"Prima, daar kan ik mee leven"', to: 'wat_krijg_je', tone: 'pos' },
      { label: '"Ik wil toch echt iets unieks"', to: 'maatwerk', tone: 'mid' },
    ],
  },

  wat_krijg_je: {
    crumb: 'Wat je krijgt',
    kind: 'info',
    step: 'Kort. Niet tien punten opnoemen.',
    say: [
      "Even wat je krijgt: een site van een paar pagina's, wij schrijven de teksten, wij zetten jouw foto's erin, en we zorgen dat je gevonden wordt op je vak en je regio. Binnen zeven werkdagen online.",
      'En je betaalt pas als hij klaar is en jij hem gezien hebt.',
    ],
    tip: 'Drie zinnen is genoeg. Hoe langer je opsomt, hoe meer je klinkt alsof je moet overtuigen.',
    options: [
      { label: 'Door naar de € 50 per maand', to: 'de_50', tone: 'pos' },
      { label: '"Ik heb helemaal geen foto\'s"', to: 'geen_fotos', tone: 'mid' },
      { label: '"En als het me niet bevalt?"', to: 'niet_mooi', tone: 'mid' },
      { label: '"Zeven dagen, hoe kan dat?"', to: 'hoe_snel', tone: 'mid' },
      { label: '"En als ik later meer wil?"', to: 'later_meer', tone: 'mid' },
    ],
  },

  later_meer: {
    crumb: 'Later uitbreiden',
    kind: 'vraag',
    step: 'Dit is een koopsignaal, geen bezwaar',
    say: [
      'Dat kan gewoon. Een extra pagina, een nieuwe dienst erbij, een fotogalerij — dat doen we tegen ons uurtarief, en meestal is dat een paar honderd euro.',
      'Wil je op termijn echt een andere kant op, met een webshop of een klantportaal, dan bouwen we dat als apart traject. Maar dan weten we elkaar al te vinden.',
    ],
    tip: '**Iemand die vraagt hoe het over een jaar gaat, is in gedachten al klant.** Antwoord kort en ga door naar de afsluiting — niet uitweiden over toekomstscenario\'s.',
    options: [{ label: 'Door naar de € 50 per maand', to: 'de_50', tone: 'pos' }],
  },

  de_50: {
    crumb: 'De € 50',
    kind: 'doel',
    step: 'Noem dit zelf, vóórdat hij ernaar vraagt',
    say: [
      'En dan het maandbedrag, dat noem ik er meteen bij zodat je niet voor verrassingen komt te staan. Naast die vijfhonderd euro is het **vijftig euro per maand**. Daarvoor draait je site, doen wij de back-ups, de beveiliging en de updates, en lossen we het op als er iets kapotgaat. Twee kleine tekstwijzigingen per maand zitten erbij.',
    ],
    tip: '**Dit is het belangrijkste moment van het gesprek.** Wie dit pas noemt als de klant erom vraagt, staat de rest van het gesprek in de verdediging. Wie het zelf aankaart, koopt vertrouwen. Zeg het rustig en ga daarna gewoon door.\n\nKwam deze lead van Facebook en heb je de prijscheck al gedaan? Dan is dit een korte herhaling, geen nieuwe onthulling. Dat scheelt je de helft van de bezwaren.',
    question: 'Hoe reageert hij?',
    options: [
      { label: '"Prima, dat is logisch"', to: 'kwalificeren', tone: 'pos' },
      { label: '"Dus ik zit daaraan vast?"', to: 'bezwaar_50', tone: 'mid' },
      { label: '"En als ik stop, wat gebeurt er dan?"', to: 'bij_stoppen', tone: 'mid' },
      { label: '"Kan ik het niet zonder dat abonnement?"', to: 'zonder_abo', tone: 'mid' },
      { label: '"Alles bij elkaar is dat me te veel"', to: 'te_duur', tone: 'mid' },
    ],
  },

  te_duur: {
    crumb: 'Te duur',
    kind: 'bezwaar',
    step: 'Reken het om naar maanden, niet naar een bedrag',
    say: [
      "Dat snap ik. Even omgerekend: het eerste jaar kost je elfhonderd euro, dus zo'n negentig euro per maand. Daarna vijftig.",
      'De vraag is eigenlijk: levert je website je in een jaar één klant op? Bij de meeste bedrijven die wij doen is dat er niet één maar een stuk of tien. Zo niet, dan is elke website te duur — ook een van tweeduizend.',
    ],
    tip: '**Niet zakken met je prijs.** Je hebt geen ruimte: je bent al de goedkoopste serieuze optie in de markt. Wie dit écht te duur vindt, is niet jouw klant, en dat is prima — die had je ook niet willen hebben op zeven dagen doorlooptijd.\n\nWat je wél kunt: gespreid betalen aanbieden bij iemand die je gelooft. Maar bied dat pas aan als het alternatief een nee is.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Zo had ik het niet bekeken"', to: 'kwalificeren', tone: 'pos' },
      { label: '"Kan ik gespreid betalen?"', to: 'gespreid', tone: 'mid' },
      { label: '"Nee, het is te veel"', to: 'end_nee', tone: 'neg' },
    ],
  },

  gespreid: {
    crumb: 'Gespreid',
    kind: 'bezwaar',
    step: 'Kan, maar wel op jouw voorwaarden',
    say: [
      'Dat kan. Dan doen we **[bijvoorbeeld: 250 bij de start en 250 bij oplevering]**, en het maandbedrag loopt gewoon mee.',
    ],
    tip: '**Bij gespreid betalen wil je wél iets vooraf.** Anders bouw je zeven dagen voor iemand die daarna niet meer opneemt. Een aanbetaling is geen wantrouwen, het is hoe iedereen in de bouw werkt — en dat begrijpt jouw doelgroep als geen ander.\n\nZet de afspraak altijd in de bevestigingsmail. Mondeling is geen betaalafspraak.',
    options: [
      { label: '"Prima"', to: 'kwalificeren', tone: 'pos' },
      { label: '"Nee, laat maar"', to: 'end_later', tone: 'mid' },
    ],
  },

  bezwaar_50: {
    crumb: 'Vastzitten',
    kind: 'bezwaar',
    step: 'Draai het om: waar betaal je voor',
    say: [
      'Je zit vast aan een opzegtermijn van **[termijn]**, verder niet. Maar even eerlijk: een website zonder hosting bestaat niet. Iedereen betaalt dat, alleen zit het bij anderen verstopt in een jaarfactuur van driehonderd euro plus losse rekeningen als er iets moet gebeuren.',
      'Bij ons weet je wat je per maand kwijt bent en bel je gewoon als er iets is.',
    ],
    tip: '**Zorg dat je die termijn kent voordat je belt.** Zie het spiekbriefje onderaan: in je overeenkomst staat hier nog een keuze open. Aarzelen op dit punt kost je het gesprek — dit is precies het moment waarop mensen op hun hoede zijn.',
    options: [
      { label: '"Ah zo, prima"', to: 'kwalificeren', tone: 'pos' },
      { label: '"Toch nog even nadenken"', to: 'nadenken', tone: 'mid' },
    ],
  },

  bij_stoppen: {
    crumb: 'Bij stoppen',
    kind: 'bezwaar',
    step: 'Volledig eerlijk zijn, ook als het minder leuk klinkt',
    say: [
      'Als je stopt, gaat de site offline. De hosting stopt dan namelijk. Je domeinnaam blijft wel gewoon van jou — die staat op jouw naam en die kun je meenemen.',
      "En je krijgt je teksten en foto's mee als je die wilt hebben.",
    ],
    tip: '**Nooit vaag doen over dit punt.** Mensen accepteren bijna elke voorwaarde die vooraf duidelijk is, en bijna geen enkele die ze achteraf ontdekken. Hier verliezen websiteabonnementen hun goede naam.',
    options: [
      { label: '"Duidelijk, geen probleem"', to: 'kwalificeren', tone: 'pos' },
      { label: '"Dat vind ik niks"', to: 'zonder_abo', tone: 'mid' },
    ],
  },

  zonder_abo: {
    crumb: 'Zonder abonnement',
    kind: 'bezwaar',
    step: 'Hier moet je een grens trekken',
    say: [
      'Dat kan bij ons niet, en dat is een bewuste keuze. Voor vijfhonderd euro kunnen we een site bouwen omdat we hem daarna ook draaiend houden. Zou je hem eenmalig kopen, dan zaten we op een heel ander bedrag.',
      'Wil je liever een site die helemaal van jou is en waar je zelf hosting voor regelt, dan is maatwerk de betere route. Dat kan ook — dan zit je vanaf vijfentwintighonderd.',
    ],
    tip: 'Niet zwichten. Ga je één keer akkoord met een eenmalige verkoop, dan is je model kapot — en je hele rekensom over wat een lead mag kosten hangt aan die € 50 per maand.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Oké, dan doe ik het abonnement"', to: 'kwalificeren', tone: 'pos' },
      { label: '"Vertel eens over dat maatwerk"', to: 'maatwerk', tone: 'mid' },
      { label: '"Dan haak ik af"', to: 'end_nee', tone: 'neg' },
    ],
  },

  geen_fotos: {
    crumb: "Geen foto's",
    kind: 'bezwaar',
    step: 'Het vaakst genoemde bezwaar. Maak het klein.',
    say: [
      "Dat hoeven ook geen professionele foto's te zijn. Foto's van je telefoon zijn prima — daar maken wij iets moois van. Loop straks even door je camerarol van de afgelopen maanden en stuur alles waar je een beetje trots op bent. Selecteren doen wij wel.",
    ],
    tip: '**Zeg dit twee keer in het gesprek.** Zonder die zin gaat iemand een fotograaf regelen, en daar zijn je zeven dagen. Heeft hij écht niets: bied aan om een uurtje langs te komen met je telefoon.\n\nHet intakeformulier heeft een uploadveld dat foto\'s automatisch verkleint, dus "mijn foto\'s zijn te groot om te mailen" is geen bezwaar meer. Zeg dat er gerust bij.',
    options: [
      { label: '"Dat lukt wel"', to: 'de_50', tone: 'pos' },
      { label: '"Ik heb echt helemaal niks"', to: 'wij_komen_filmen', tone: 'mid' },
    ],
  },

  wij_komen_filmen: {
    crumb: 'Wij komen langs',
    kind: 'info',
    step: 'Kost je een uur, levert een veel betere site op',
    say: [
      'Dan kom ik een uurtje langs met mijn telefoon en maak ik ze zelf. Dat doen we er bij je eerste site gewoon bij, en het scheelt jou een hoop gedoe.',
    ],
    tip: 'Bij je eerste klanten zou ik dit gewoon gratis doen. Je krijgt er veel betere sites én portfoliomateriaal voor terug — en dat portfolio is op dit moment je grootste tekort. Binnen Noord-Nederland is langsgaan zelden meer dan een uur rijden.',
    options: [{ label: '"Graag"', to: 'de_50', tone: 'pos' }],
  },

  niet_mooi: {
    crumb: 'Als het niet bevalt',
    kind: 'bezwaar',
    step: 'Wees concreet over de feedbackronde',
    say: [
      'Op dag vier krijg je een link waarmee je hem kunt bekijken voordat hij online staat. Dan geef je je opmerkingen door en verwerken wij die. Pas als jij tevreden bent, gaat hij live — en pas dan betaal je.',
    ],
    tip: 'Noem dat het één ronde is, maar leg daar in dit gesprek niet de nadruk op. Dat staat in je bevestiging. Nu gaat het om de geruststelling.',
    options: [
      { label: '"Dat klinkt goed"', to: 'de_50', tone: 'pos' },
      { label: '"En als ik het dan nog niet mooi vind?"', to: 'nog_niet_mooi', tone: 'mid' },
    ],
  },

  nog_niet_mooi: {
    crumb: 'Dan nog niet',
    kind: 'bezwaar',
    step: 'Eerlijk over de grens',
    say: [
      'Dan passen we het aan tot het klopt. Wat ik niet doe is drie keer een compleet ander ontwerp maken — daar is de prijs niet op gebouwd. Maar in de praktijk zit het vrijwel altijd in details, en die halen we er in één ronde uit.',
      'Daarom vraag ik je in het formulier ook om twee sites die je mooi vindt. Dan weet ik vooraf welke kant het op moet.',
    ],
    options: [
      { label: '"Prima"', to: 'de_50', tone: 'pos' },
      { label: '"Ik twijfel"', to: 'nadenken', tone: 'mid' },
    ],
  },

  hoe_snel: {
    crumb: 'Zo snel?',
    kind: 'bezwaar',
    step: 'Twijfel over kwaliteit — leg het mechanisme uit',
    say: [
      'Omdat we niet elke keer opnieuw beginnen. We hebben een vaste manier van werken en een bibliotheek met bouwblokken die we per bedrijf anders inzetten. Het bouwen zelf is dus niet het lange stuk — bij de meeste bureaus zit de tijd in vergaderen, wachten en revisierondes.',
      "En die zeven dagen gaan pas lopen als jouw formulier en foto's binnen zijn. Dan hangt het niet meer van jouw agenda af.",
    ],
    tip: '**Je kunt dit inmiddels met droge ogen zeggen.** Je hebt een site in één ochtend live gekregen. Beloof die ochtend alleen niet — zeven werkdagen is je afspraak, en marge is precies wat je in de zomer of bij ziekte nodig hebt.',
    options: [{ label: '"Slim"', to: 'de_50', tone: 'pos' }],
  },

  kwalificeren: {
    crumb: 'Kwalificeren',
    kind: 'vraag',
    step: 'Drie korte checks, losjes gesteld',
    say: [
      'Ga jij hier zelf over, of denkt er iemand mee?',
      'Wanneer zou je online willen staan?',
      "En lukt het je om binnen een paar dagen wat foto's en je gegevens aan te leveren? Want daar hangt de planning aan vast.",
    ],
    tip: '**Die derde is je belangrijkste filter.** Iemand die daar aarzelt, gaat je planning laten uitlopen. Liever nu weten dan op dag tien.\n\nBij Facebook-leads heb je het antwoord op vraag twee al: dat vulde hij in bij "wanneer wil je starten". Gebruik dat als bevestiging in plaats van als vraag — *"je gaf aan [antwoord], klopt dat nog?"*',
    question: 'Waar loopt het op vast?',
    options: [
      { label: 'Nergens — beslisser, timing en materiaal kloppen', to: 'afsluiten', tone: 'pos' },
      { label: '"Ik moet even met mijn compagnon overleggen"', to: 'overleggen', tone: 'mid' },
      { label: '"Aanleveren wordt lastig, ik heb het druk"', to: 'druk', tone: 'mid' },
      { label: '"Ik wil er nog even over nadenken"', to: 'nadenken', tone: 'mid' },
    ],
  },

  druk: {
    crumb: 'Te druk',
    kind: 'bezwaar',
    step: 'Maak het klein en concreet',
    say: [
      "Het is echt niet veel werk: een formuliertje van tien minuten en wat foto's van je telefoon. En als je wilt bel ik je gewoon en lopen we het samen door — dan ben je in een kwartier klaar.",
    ],
    tip: 'Dit aanbod om het samen door te lopen redt meer projecten dan wat dan ook. Bied het actief aan bij twijfel. Jij kunt het formulier vanuit je backoffice ook zelf invullen terwijl je hem aan de lijn hebt.',
    options: [
      { label: '"Dat zou fijn zijn"', to: 'afsluiten', tone: 'pos' },
      { label: '"Ik doe het zelf wel, maar niet deze week"', to: 'end_later', tone: 'mid' },
    ],
  },

  overleggen: {
    crumb: 'Tweede beslisser',
    kind: 'bezwaar',
    step: 'Laat hem niet jouw verkoopwerk doen',
    say: [
      'Logisch. Zal ik het even kort op de mail zetten, zodat je haar precies kunt laten zien wat het inhoudt? Dan bel ik je **[concrete dag]** even terug om te horen wat jullie ervan vinden.',
    ],
    tip: 'Bij een aanbod van vijfhonderd euro is een gezamenlijke afspraak inplannen overdreven — dat maakt het zwaarder dan het is. Een duidelijke mail plus een terugbelmoment is hier de juiste maat.\n\nStuur het A4 uit je opdrachtbevestiging mee. Dat is precies geschreven om zonder jou gelezen te worden.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Prima, doe maar"', to: 'end_terugbel', tone: 'pos' },
      { label: '"Ik bel je zelf wel"', to: 'end_later', tone: 'mid' },
    ],
  },

  nadenken: {
    crumb: 'Nadenken',
    kind: 'bezwaar',
    step: 'Achterhaal waarover',
    say: [
      'Prima. Waar wil je precies over nadenken — over of je het wilt, of over het maandbedrag?',
    ],
    tip: '"Nadenken" is bijna nooit letterlijk nadenken. Deze vraag haalt de echte reden boven, en die kun je wél behandelen.',
    question: 'Wat komt eruit?',
    options: [
      { label: 'Het gaat over het abonnement', to: 'bezwaar_50', tone: 'mid' },
      { label: 'Het gaat over het geld', to: 'te_duur', tone: 'mid' },
      { label: 'Hij twijfelt of het goed genoeg wordt', to: 'niet_mooi', tone: 'mid' },
      { label: 'Geen duidelijk antwoord', to: 'planning', tone: 'mid' },
    ],
  },

  planning: {
    crumb: 'De planning',
    kind: 'doel',
    step: 'Een zacht duwtje dat wél klopt',
    say: [
      'Helemaal goed. Eén ding: we plannen per week in, en voor **[week]** heb ik nog ruimte. Zal ik je daarvoor voorlopig inplannen? Dan hoef je nu nog niets te beslissen — ik bel je **[dag]** terug en dan hoor ik het.',
    ],
    tip: '**Let op: dit is aangepast.** In de vorige versie stond hier "we nemen er maar twee per week aan". Dat klopt niet meer — je bouwt inmiddels een site in een ochtend, dus je capaciteit is je bottleneck niet.\n\nVerzin geen schaarste die er niet is. Zeker niet in Drenthe, waar mensen elkaar kennen en verhalen rondgaan. Een planningsmoment met een terugbelafspraak doet hetzelfde werk en is gewoon waar.',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Ja, doe maar"', to: 'end_terugbel', tone: 'pos' },
      { label: '"Nee, doe maar niet"', to: 'end_later', tone: 'mid' },
    ],
  },

  mailtje: {
    crumb: 'Mailtje',
    kind: 'bezwaar',
    step: 'Hier hoef je niet moeilijk over te doen',
    say: [
      'Doe ik. Alles staat trouwens ook gewoon op weekwebsite.nl — prijs, wat je krijgt, hoe het loopt. Ik stuur je een korte mail met de belangrijkste punten en bel je **[concrete dag]** even terug.',
    ],
    tip: 'Bij een aanbod met een openbare prijs is "stuur maar info" veel minder een afpoeier dan bij maatwerk. Er ís niets te verbergen. Stuur het en zet je terugbelmoment vast.',
    options: [{ label: '"Prima"', to: 'end_terugbel', tone: 'pos' }],
  },

  afsluiten: {
    crumb: 'Afsluiten',
    kind: 'doel',
    step: 'Nu afsluiten. Geen tweede gesprek inplannen.',
    say: [
      'Dan stel ik voor dat we het gewoon doen. Ik heb **[week]** ruimte — zal ik je daarvoor inplannen?',
      'Ik stuur je zo een mail met precies wat je krijgt en een link naar het formulier. Vul je dat vandaag of morgen in, dan sta je **[datum]** online.',
    ],
    tip: '**Dit is het grote verschil met je maatwerk-gesprek.** Daar verkoop je een afspraak, hier sluit je af. Het aanbod is vast, de prijs staat op de site, er valt niets uit te zoeken. Een tweede gesprek kost je twee dagen doorlooptijd en een deel van je conversie.\n\nNoem de opleverdatum hardop en concreet. "Dan sta je 26 augustus online" doet meer dan "binnen zeven werkdagen".',
    question: 'Wat zegt hij?',
    options: [
      { label: '"Ja, doen we"', to: 'intake_nu', tone: 'pos' },
      { label: '"Stuur eerst maar die mail"', to: 'end_terugbel', tone: 'mid' },
      { label: '"Toch nog even nadenken"', to: 'planning', tone: 'mid' },
    ],
  },

  intake_nu: {
    crumb: 'Intake nu',
    kind: 'doel',
    step: 'Blijf aan de lijn — dit scheelt je dagen',
    say: [
      "Top. Heb je nu nog tien minuten? Dan stel ik je meteen een paar vragen over je bedrijf, dan hoef jij straks alleen nog wat foto's door te sturen.",
      'Vind je het goed als ik dit even opneem? Dan hoef ik geen aantekeningen te maken en kan ik jouw eigen woorden op de site gebruiken. Dat leest altijd beter dan wat ik erover zou verzinnen.',
    ],
    tip: '**De vijf vragen:** wat doen jullie precies · welke klus doe je het liefst · waarom kiezen mensen voor jullie · wat vragen klanten altijd voordat ze ja zeggen · wat moet iemand doen als hij op je site komt.\n\nDoe je dit nu niet, dan moet hij het zelf opschrijven — en dat kost je gemiddeld vier dagen. Het opnemen is geen extraatje: dat transcript gaat samen met het intakeformulier rechtstreeks je tekstpijplijn in.',
    question: 'Heeft hij tijd?',
    options: [
      { label: '"Ja hoor, vraag maar"', to: 'end_gesloten_intake', tone: 'pos' },
      { label: '"Nu even niet"', to: 'end_gesloten', tone: 'mid' },
    ],
  },

  end_gesloten_intake: {
    crumb: 'Gesloten + intake',
    outcome: 'good',
    step: 'Best mogelijke uitkomst',
    title: 'Verkocht én de intake binnen. Doe dit nu, in deze volgorde.',
    list: [
      'Stel de vijf verhaalvragen en neem op — dat transcript is straks je hele tekst',
      'Backoffice: zet de lead om naar een intake, vul de bedrijfsnaam in en genereer de intakelink',
      'Bevestigingsmail binnen tien minuten: het A4, de overeenkomst, de algemene voorwaarden en de intakelink in één mail',
      'Vraag expliciet om "akkoord" als antwoord op die mail — dat is je handtekening',
      "Zeg erbij dat hij alleen nog foto's hoeft te uploaden",
      'Zet de opleverdatum in je agenda en noem hem in de mail',
      'Status in de backoffice op in_progress',
    ],
  },

  end_gesloten: {
    crumb: 'Gesloten',
    outcome: 'good',
    step: 'Verkocht, intake volgt',
    title: 'Verkocht. Nu meteen vastleggen.',
    list: [
      'Backoffice: intake aanmaken, bedrijfsnaam invullen, intakelink genereren',
      'Bevestigingsmail binnen tien minuten: A4, overeenkomst, algemene voorwaarden en de intakelink',
      'Vraag om akkoord per e-mail — "stuur deze mail even terug met akkoord"',
      'Plan een moment om de vijf verhaalvragen alsnog te stellen, liefst binnen twee dagen',
      'Herinner via WhatsApp op dag 2 en dag 4 als het formulier uitblijft',
      'Geen materiaal na tien dagen? Bel nog één keer, en geef de plek daarna vrij',
    ],
  },

  end_maatwerk: {
    crumb: 'Naar maatwerk',
    outcome: 'good',
    step: 'Grotere order, andere route',
    title: 'Doorgezet naar maatwerk. Dit is winst.',
    list: [
      'Plan een half uur in — hier verkoop je wél een afspraak in plaats van meteen af te sluiten',
      'Schakel over op de belflow van Flits Digital voor dat gesprek',
      'Noteer in je leadlijst: bron = Weekwebsite-campagne, uitkomst = maatwerk',
      'Stuur een bevestiging met de afspraak en een paar voorbeelden van maatwerkprojecten',
      'Reken deze lead mee in je campagnecheck. Eén maatwerkklant uit de advertenties verandert je hele rekensom over wat een lead mag kosten',
    ],
  },

  end_terugbel: {
    crumb: 'Terugbellen',
    outcome: 'mid',
    step: 'Nog niet klaar, wel vastgelegd',
    title: 'Terugbelmoment afgesproken.',
    list: [
      'Zet het moment in je agenda met een herinnering',
      'Stuur de mail die je beloofde — binnen het uur, niet morgen',
      'Bevestig per appje: "Ik bel je [dag] om [tijd], tot dan!"',
      'Bel op de afgesproken tijd. Doe je dat niet, dan ben jij de partij die zich niet aan afspraken houdt',
      'Zet de status in je backoffice op new met een notitie over wat je hebt afgesproken',
    ],
  },

  end_geen_contact: {
    crumb: 'Geen contact',
    outcome: 'mid',
    step: 'Drie pogingen gehad, niets gehoord',
    title: 'Niet bereikt. Nog niet afschrijven.',
    list: [
      'Stuur een laatste mail: kort, met de prijs en een link om zelf een moment te kiezen',
      'Zet een herinnering over twee weken voor één laatste poging',
      'Noteer bij deze lead: onbereikbaar, met de tijdstippen waarop je belde',
      'Kijk bij je dag 14-check hoeveel procent van je leads je wél aan de lijn kreeg. Zit je onder de 60%, dan gaat dat over je belsnelheid — niet over je advertenties',
      'Blijft dit structureel? Dan is je Expresformulier te makkelijk. Een extra vraag erin verlaagt je aantal leads maar verhoogt de kwaliteit',
    ],
  },

  end_later: {
    crumb: 'Later',
    outcome: 'mid',
    step: 'Niet weggooien',
    title: 'Speelt nu niet.',
    list: [
      'Noteer waaróm het nu niet speelt — dat is je opening over drie maanden',
      'Zet een herinnering over drie maanden',
      'In je leadlijst: gekwalificeerd = nee, met de reden erbij',
      'Deze leads zijn later je goedkoopste omzet. Ze kosten je niets meer aan advertentiebudget',
    ],
  },

  end_nee: {
    crumb: 'Nee',
    outcome: 'bad',
    step: 'Klaar, en dat is prima',
    title: 'Duidelijk nee. Netjes afsluiten.',
    list: [
      'Zeg: "Helemaal goed, dan laat ik je met rust. Fijne dag nog."',
      'Geen tweede poging — dan word je de vervelende partij',
      'In je leadlijst: gekwalificeerd = nee, met de reden',
      'Noteer wél of het over de prijs ging of over de € 50 per maand. Zie je dat vaak terug, dan zit het in je advertentie, niet in je gesprek',
      'Bij een aanbod met een openbare prijs is een nee vaak gewoon een nee. Dat is geen slecht teken, dat is je filter die werkt',
    ],
  },
};

/** Wat je uit je hoofd moet kennen voordat je belt. */
export const CHEATSHEET: [string, string][] = [
  ['Prijs', '€ 500 eenmalig + € 50 per maand'],
  ['Levertijd', '7 werkdagen, tellend vanaf compleet aangeleverd materiaal'],
  ['Betaling', 'Pas na oplevering, betaaltermijn 14 dagen'],
  ['Feedback', 'Één ronde op de preview, dag 4'],
  ['Bij opzeggen', 'Site gaat offline, domein blijft van de klant'],
  ['Maatwerk', 'Flits Digital, vanaf € 2.500'],
  ['Regio campagne', 'Noord-Nederland'],
  ['Intakelink', 'Genereer je in de backoffice op start.weekwebsite.nl'],
];

export const CHEATSHEET_TODO =
  'Nog invullen voordat je belt: de opzegtermijn. In je overeenkomst staat daar nog "maandelijks of na 12 maanden". Als iemand hiernaar vraagt en je aarzelt, ben je het gesprek kwijt — kies dit vandaag.';
