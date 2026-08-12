import type { Status } from './intake-status.ts';

/**
 * Feitelijk geformuleerd, niet waarderend — de klant mag dit opvragen.
 * De waarden staan ook als check-constraint op de kolom.
 */
export const STALL_REASONS: Record<string, string> = {
  geen_fotos: 'Heeft geen foto’s',
  geen_tijd: 'Geen tijd gehad',
  wacht_op_ander: 'Wacht op iemand anders',
  te_veel_gedoe: 'Vond het te veel gedoe',
  onbereikbaar: 'Niet bereikbaar',
  overig: 'Overig — zie notities',
};

export function parseStallReason(value: unknown): string | null {
  return typeof value === 'string' && value in STALL_REASONS ? value : null;
}

/** Zichtbare tekst hoort hier; de levensloop zelf staat in intake-status.ts. */
export const STATUS_LABEL: Record<Status, string> = {
  new: 'Nieuw',
  in_progress: 'Bezig met invullen',
  submitted: 'Compleet',
  building: 'In aanbouw',
  review: 'Preview verstuurd',
  live: 'Online',
  cancelled: 'Afgehaakt',
};
