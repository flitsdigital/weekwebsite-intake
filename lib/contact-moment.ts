/** Hoe je iemand benaderd hebt. */
export const CHANNELS = ['telefoon', 'whatsapp', 'mail', 'langsgeweest'] as const;
export type Channel = (typeof CHANNELS)[number];

/** Wat eruit kwam. */
export const OUTCOMES = [
  'gesproken',
  'niet_opgenomen',
  'voicemail',
  'teruggebeld',
  'afspraak',
  'verstuurd',
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const CHANNEL_LABEL: Record<Channel, string> = {
  telefoon: 'Gebeld',
  whatsapp: 'Geappt',
  mail: 'Gemaild',
  langsgeweest: 'Langsgeweest',
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  gesproken: 'gesproken',
  niet_opgenomen: 'niet opgenomen',
  voicemail: 'voicemail ingesproken',
  teruggebeld: 'werd teruggebeld',
  afspraak: 'afspraak gemaakt',
  verstuurd: 'verstuurd',
};

export function parseChannel(value: unknown): Channel | null {
  return typeof value === 'string' && (CHANNELS as readonly string[]).includes(value)
    ? (value as Channel)
    : null;
}

export function parseOutcome(value: unknown): Outcome | null {
  return typeof value === 'string' && (OUTCOMES as readonly string[]).includes(value)
    ? (value as Outcome)
    : null;
}

/**
 * Kanaal en uitkomst horen bij elkaar: allebei ingevuld maakt er een
 * contactmoment van, allebei leeg een losse aantekening. Een halve invulling
 * gooien we weg in plaats van hem half op te slaan — de database weigert hem toch.
 */
export function parseContact(
  channel: unknown,
  outcome: unknown
): { channel: Channel; outcome: Outcome } | null {
  const kanaal = parseChannel(channel);
  const uitkomst = parseOutcome(outcome);
  return kanaal && uitkomst ? { channel: kanaal, outcome: uitkomst } : null;
}

/** "Gebeld — niet opgenomen", of null bij een losse aantekening. */
export function contactLabel(channel: unknown, outcome: unknown): string | null {
  const contact = parseContact(channel, outcome);
  return contact
    ? `${CHANNEL_LABEL[contact.channel]} — ${OUTCOME_LABEL[contact.outcome]}`
    : null;
}
