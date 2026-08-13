/**
 * Waar een lead vandaan komt. Bewust géén vaste lijst in de database: komt er
 * een kanaal bij dat we nog niet kennen, dan mag dat nooit een lead kosten.
 * Onbekende waarden worden opgeslagen zoals ze binnenkwamen.
 */
const LABELS: Record<string, string> = {
  website: 'Website',
  facebook: 'Facebook',
  handmatig: 'Handmatig ingevoerd',
  onbekend: 'Onbekend',
};

/** Omschrijvingen die we in de praktijk tegenkomen, teruggebracht tot één woord. */
const HERKEND: [RegExp, string][] = [
  [/weekwebsite|website|intake-?modal/, 'website'],
  [/facebook|fb|lead\s*ads/, 'facebook'],
  [/handmatig|manual/, 'handmatig'],
];

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const normalise = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

export function deriveSource(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'onbekend';

  const byKey = new Map(
    Object.entries(payload as Record<string, unknown>).map(([k, v]) => [normalise(k), v])
  );

  const gezegd = byKey.get('bron') ?? byKey.get('source');
  if (typeof gezegd === 'string' && gezegd.trim()) {
    const tekst = gezegd.toLowerCase();
    const treffer = HERKEND.find(([patroon]) => patroon.test(tekst));
    return treffer ? treffer[1] : slug(gezegd);
  }

  // Alleen Facebook Lead Ads stuurt een leadgen-id mee.
  if (byKey.has('leadgenid') || byKey.has('leadid')) return 'facebook';

  return 'onbekend';
}

export function sourceLabel(source: string): string {
  return LABELS[source] ?? source;
}
