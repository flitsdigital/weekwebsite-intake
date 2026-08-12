const DAY = 86_400_000;

/**
 * Een `date` uit Postgres komt als "2026-08-20" binnen. Zonder tijd leest de
 * browser dat als middernacht UTC, wat westelijk van Greenwich een dag terugvalt.
 * Twaalf uur 's middags ligt overal in dezelfde kalenderdag.
 */
function fromDbDate(value: string): Date {
  return new Date(value.length === 10 ? `${value}T12:00:00` : value);
}

export function daysSince(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  return Math.floor((now - new Date(iso).getTime()) / DAY);
}

/** Hele dagen tot een opleverdatum; vandaag telt als 1, gisteren als -1. */
export function daysUntil(dbDate: string | null, now = Date.now()): number | null {
  if (!dbDate) return null;
  return Math.ceil((fromDbDate(dbDate).getTime() - now) / DAY);
}

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(fromDbDate(value));
}

export function formatLongDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fromDbDate(value));
}
