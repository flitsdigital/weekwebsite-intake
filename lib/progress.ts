import { REQUIRED_KEYS } from './questions.ts';

/** Ingevulde verplichte velden gedeeld door het totaal, zoals SPEC hoofdstuk 6. */
export function progressPercent(answers: Record<string, unknown> | null) {
  const filled = REQUIRED_KEYS.filter((key) => String(answers?.[key] ?? '').trim()).length;
  return Math.round((filled / REQUIRED_KEYS.length) * 100);
}
