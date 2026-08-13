/**
 * De verkoopfase, in procesvolgorde. Zie CONTEXT.md en docs/adr/0002.
 *
 * 'niet_bereikt' staat hier bewust niet meer bij: dat is de uitkomst van één
 * belpoging, niet de toestand van de lead. Bel je drie keer tevergeefs en krijg
 * je hem de vierde keer te pakken, dan zijn er drie momenten "niet opgenomen"
 * en is de lead 'gesproken'.
 */
export const LEAD_STATUSES = ['nieuw', 'gesproken', 'afspraak', 'gewonnen', 'verloren'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

const CLOSED: readonly string[] = ['gewonnen', 'verloren'];

/** Hoe dringend is deze lead vandaag. */
export type Due = 'nieuw' | 'geen_vervolg' | 'te_laat' | 'vandaag' | 'later' | 'geen';

export function isOpen(status: string): boolean {
  return !CLOSED.includes(status);
}

export function parseLeadStatus(value: unknown): LeadStatus | null {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value)
    ? (value as LeadStatus)
    : null;
}

/**
 * `today` als "YYYY-MM-DD" — datums vergelijken we als tekst, want zo staan ze
 * ook in Postgres. Dat scheelt tijdzonegedoe: een `date` heeft geen tijdstip.
 */
export function leadDue(
  lead: { status: string; nextActionAt: string | null; contactCount: number },
  today: string
): Due {
  if (!isOpen(lead.status)) return 'geen';

  // Een geplande datum wint: je hebt bewust besloten wanneer je weer wat doet.
  if (lead.nextActionAt) {
    if (lead.nextActionAt < today) return 'te_laat';
    if (lead.nextActionAt === today) return 'vandaag';
    return 'later';
  }

  // Zonder plan: nog nooit benaderd is dringender dan benaderd-maar-vergeten.
  return lead.contactCount === 0 ? 'nieuw' : 'geen_vervolg';
}

/** Staat bovenaan het Vandaag-scherm; de rest volgt in deze volgorde. */
export const DUE_ORDER: Due[] = ['nieuw', 'te_laat', 'vandaag', 'geen_vervolg', 'later', 'geen'];

/**
 * Minuten tussen binnenkomst en de eerste belpoging. Het getal dat de conversie
 * het beste voorspelt — de eigen regel is "bel binnen 5 minuten".
 */
export function responseMinutes(receivedAt: string, firstAttemptAt: string | null): number | null {
  if (!firstAttemptAt) return null;
  const minutes = (new Date(firstAttemptAt).getTime() - new Date(receivedAt).getTime()) / 60_000;
  return Math.max(0, Math.round(minutes));
}
