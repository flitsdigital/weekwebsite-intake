/** De levensloop uit de PRD, in procesvolgorde. */
export const STATUSES = [
  'new',
  'in_progress',
  'submitted',
  'building',
  'review',
  'live',
  'cancelled',
] as const;

export type Status = (typeof STATUSES)[number];

/** De klant mag zijn antwoorden nog wijzigen. Dit is de schrijfgrendel. */
export const EDITABLE: readonly Status[] = ['new', 'in_progress'];

/**
 * Wij wachten op de klant. Vandaag dezelfde waarden als EDITABLE, maar een ander
 * begrip — een status die wél bewerkbaar is maar niet wacht hoort hier straks niet bij.
 */
export const WAITING: readonly Status[] = ['new', 'in_progress'];

/** Wij zijn aan zet. */
export const ACTIVE: readonly Status[] = ['building', 'review'];

const ATTENTION_AFTER_DAYS = 2;

export function isEditable(status: string): boolean {
  return (EDITABLE as readonly string[]).includes(status);
}

export function isWaiting(status: string): boolean {
  return (WAITING as readonly string[]).includes(status);
}

export function isActive(status: string): boolean {
  return (ACTIVE as readonly string[]).includes(status);
}

/** SPEC hoofdstuk 6: wachtend én meer dan twee dagen geen activiteit. */
export function needsAttention(status: string, idleDays: number): boolean {
  return isWaiting(status) && idleDays > ATTENTION_AFTER_DAYS;
}

/** De enige plek waar een string uit de database een Status wordt. */
export function parseStatus(value: unknown): Status | null {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value)
    ? (value as Status)
    : null;
}
