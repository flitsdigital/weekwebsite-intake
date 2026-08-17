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

/**
 * Hele werkdagen tussen twee momenten. Telt de dagen ná `from` tot en met de dag
 * van `to`, weekenden overgeslagen — dezelfde rekenwijze als de opleverdatum.
 */
export function workingDaysBetween(from: string | number | Date, to: string | number | Date) {
  const day = (value: string | number | Date) => {
    const d = new Date(value);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const cursor = day(from);
  const end = day(to);
  let working = 0;

  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) working++;
  }

  return working;
}

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(fromDbDate(value));
}

/**
 * Hoe lang geleden iets binnenkwam, in spreektaal. Bij een verse lead is dit
 * de urgentie zelf — de eigen regel is bellen binnen vijf minuten.
 */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'net binnen';
  if (minutes < 60) return `${minutes} min geleden`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} uur geleden`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'gisteren';
  if (days < 31) return `${days} dagen geleden`;

  const months = Math.floor(days / 30);
  return months === 1 ? 'vorige maand' : `${months} maanden geleden`;
}

/** Voor het title-attribuut: de relatieve tijd blijft leesbaar, dit is exact. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatLongDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fromDbDate(value));
}
