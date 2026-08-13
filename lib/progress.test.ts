import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressPercent } from './progress.ts';
import { requiredKeys } from './questions.ts';

const KEYS = requiredKeys({});
const alles = Object.fromEntries(KEYS.map((k) => [k, 'ingevuld']));

test('leeg is nul, alles ingevuld is honderd', () => {
  assert.equal(progressPercent(null), 0);
  assert.equal(progressPercent({}), 0);
  assert.equal(progressPercent(alles), 100);
});

test('alleen spaties telt niet als ingevuld', () => {
  // Uitrekenen in plaats van hardcoderen: er komt vanzelf een verplicht veld bij.
  const eenMinder = Math.round(((KEYS.length - 1) / KEYS.length) * 100);
  assert.equal(progressPercent({ ...alles, [KEYS[0]]: '   ' }), eenMinder);
});

test('optionele velden tellen niet mee', () => {
  assert.equal(progressPercent({ ...alles, kvk: 'ook ingevuld' }), 100);
  assert.equal(progressPercent({ kvk: 'alleen optioneel' }), 0);
});

test('foto’s zitten niet in de telling — die zijn nooit verplicht', () => {
  assert.equal(KEYS.includes('fotos'), false);
  assert.equal(KEYS.includes('logo'), false);
});
