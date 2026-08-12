/** De verkoopfase, in procesvolgorde. Zie CONTEXT.md en docs/adr/0002. */
export const LEAD_STATUSES = [
  'nieuw',
  'niet_bereikt',
  'gesproken',
  'afspraak',
  'gewonnen',
  'verloren',
] as const;

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
  lead: { status: string; nextActionAt: string | null },
  today: string
): Due {
  if (!isOpen(lead.status)) return 'geen';

  // Nog nooit gebeld gaat voor alles, ook als er al iets gepland staat.
  if (lead.status === 'nieuw') return 'nieuw';

  if (!lead.nextActionAt) return 'geen_vervolg';
  if (lead.nextActionAt < today) return 'te_laat';
  if (lead.nextActionAt === today) return 'vandaag';
  return 'later';
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
