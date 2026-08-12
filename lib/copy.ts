import type { Status } from './intake-status.ts';

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
