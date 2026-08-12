import type { Status } from './intake-status.ts';
import type { Due, LeadStatus } from './lead-status.ts';

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

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  nieuw: 'Nieuw',
  niet_bereikt: 'Niet bereikt',
  gesproken: 'Gesproken',
  afspraak: 'Afspraak staat',
  gewonnen: 'Gewonnen',
  verloren: 'Verloren',
};

export const LEAD_STATUS_DOT: Record<LeadStatus, string> = {
  nieuw: 'bg-accent',
  niet_bereikt: 'bg-orange-500',
  gesproken: 'bg-btn',
  afspraak: 'bg-purple-600',
  gewonnen: 'bg-green-600',
  verloren: 'bg-line',
};

/** Feitelijk, niet waarderend — het is een aantekening over een persoon. */
export const LOST_REASONS: Record<string, string> = {
  te_duur: 'Te duur',
  heeft_al_site: 'Heeft al een website',
  wil_zelf_bouwen: 'Wil het zelf bouwen',
  niet_bereikt: 'Niet te bereiken',
  geen_interesse: 'Geen interesse',
  overig: 'Overig — zie notities',
};

export function parseLostReason(value: unknown): string | null {
  return typeof value === 'string' && value in LOST_REASONS ? value : null;
}

export const DUE_LABEL: Record<Due, string> = {
  nieuw: 'Nog niet gebeld',
  te_laat: 'Te laat',
  vandaag: 'Vandaag',
  geen_vervolg: 'Geen vervolgactie',
  later: 'Later',
  geen: 'Afgesloten',
};

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
