import { workingDaysBetween } from './dates.ts';
import { isWaiting } from './intake-status.ts';

const STUCK_AFTER_WORKING_DAYS = 2;

export type SignalInput = {
  status: string;
  openedAt: string | null;
  startedAt: string | null;
  lastCustomerActivityAt: string | null;
  currentStep: number;
  now?: number;
};

export type Signal =
  | { kind: 'niet_geopend' }
  | { kind: 'niet_begonnen'; workingDays: number }
  | { kind: 'vast'; step: number; workingDays: number }
  | { kind: 'actief' }
  | { kind: 'niet_van_toepassing' };

/**
 * Wat is er met deze klant aan de hand, en wat doe je eraan.
 *
 * Drie toestanden met drie verschillende acties: link opnieuw sturen, bellen
 * omdat er een drempel is, of bellen over dat ene ontbrekende ding.
 */
export function intakeSignal({
  status,
  openedAt,
  startedAt,
  lastCustomerActivityAt,
  currentStep,
  now = Date.now(),
}: SignalInput): Signal {
  // Bij de overige statussen zijn wij aan zet, niet de klant.
  if (!isWaiting(status)) return { kind: 'niet_van_toepassing' };

  if (!openedAt && !startedAt) return { kind: 'niet_geopend' };

  if (!startedAt) {
    return { kind: 'niet_begonnen', workingDays: workingDaysBetween(openedAt!, now) };
  }

  const since = lastCustomerActivityAt ?? startedAt;
  const workingDays = workingDaysBetween(since, now);

  return workingDays > STUCK_AFTER_WORKING_DAYS
    ? { kind: 'vast', step: currentStep, workingDays }
    : { kind: 'actief' };
}

/** Korte Nederlandse omschrijving voor lijst, bord en detailpagina. */
export function signalText(signal: Signal): string | null {
  switch (signal.kind) {
    case 'niet_geopend':
      return 'Link nooit geopend';
    case 'niet_begonnen':
      return signal.workingDays > 0
        ? `Geopend, niets ingevuld — ${signal.workingDays} ${signal.workingDays === 1 ? 'werkdag' : 'werkdagen'}`
        : 'Geopend, nog niets ingevuld';
    case 'vast':
      return `Vast op stap ${signal.step} — ${signal.workingDays} werkdagen stil`;
    default:
      return null;
  }
}
