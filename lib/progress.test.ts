import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressPercent } from './progress.ts';
import { REQUIRED_KEYS } from './questions.ts';

const alles = Object.fromEntries(REQUIRED_KEYS.map((k) => [k, 'ingevuld']));

test('leeg is nul, alles ingevuld is honderd', () => {
  assert.equal(progressPercent(null), 0);
  assert.equal(progressPercent({}), 0);
  assert.equal(progressPercent(alles), 100);
});

test('alleen spaties telt niet als ingevuld', () => {
  assert.equal(progressPercent({ ...alles, [REQUIRED_KEYS[0]]: '   ' }), 83);
});

test('optionele velden tellen niet mee', () => {
  assert.equal(progressPercent({ ...alles, kvk: 'ook ingevuld' }), 100);
  assert.equal(progressPercent({ kvk: 'alleen optioneel' }), 0);
});

test('foto’s zitten niet in de telling — die zijn nooit verplicht', () => {
  assert.equal(REQUIRED_KEYS.includes('fotos'), false);
  assert.equal(REQUIRED_KEYS.includes('logo'), false);
});
