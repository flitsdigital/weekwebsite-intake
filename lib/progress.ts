import { requiredKeys } from './questions.ts';

/**
 * Ingevulde verplichte velden gedeeld door het totaal, zoals SPEC hoofdstuk 6.
 *
 * Telt alleen velden die bij déze antwoorden ook zichtbaar zijn. Anders kan een
 * klant die "Weet ik niet" kiest bij zijn domeinnaam nooit op honderd procent
 * komen, omdat er velden meetellen die hij niet te zien krijgt.
 */
export function progressPercent(answers: Record<string, unknown> | null) {
  const keys = requiredKeys(answers);
  if (!keys.length) return 0;

  const filled = keys.filter((key) => String(answers?.[key] ?? '').trim()).length;
  return Math.round((filled / keys.length) * 100);
}
