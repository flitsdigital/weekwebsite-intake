import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, isVisible, requiredKeys, visibleQuestions } from './questions.ts';

const vraag = (key: string) =>
  STEPS.flatMap((s) => s.questions).find((q) => q.key === key)!;

const techniek = STEPS.find((s) => s.id === 'techniek')!;

test('een vraag zonder voorwaarde is altijd zichtbaar', () => {
  assert.equal(isVisible(vraag('bedrijfsnaam'), {}), true);
  assert.equal(isVisible(vraag('bedrijfsnaam'), null), true);
});

test('"Ja" toont de domeinnaam en de provider, niets anders', () => {
  const zichtbaar = visibleQuestions(techniek, { heeft_domein: 'Ja' }).map((q) => q.key);
  assert.ok(zichtbaar.includes('domein'));
  assert.ok(zichtbaar.includes('domein_provider'));
  assert.ok(!zichtbaar.includes('domein_wens'));
  assert.ok(!zichtbaar.includes('domein_onbekend'));
});

test('"Nee" vraagt welke hij zou willen', () => {
  const zichtbaar = visibleQuestions(techniek, { heeft_domein: 'Nee, nog niet' }).map((q) => q.key);
  assert.ok(zichtbaar.includes('domein_wens'));
  assert.ok(!zichtbaar.includes('domein'));
});

test('"Weet ik niet" stelt gerust in plaats van te vragen', () => {
  const zichtbaar = visibleQuestions(techniek, { heeft_domein: 'Weet ik niet' });
  assert.ok(zichtbaar.some((q) => q.key === 'domein_onbekend' && q.type === 'info'));
  assert.ok(!zichtbaar.some((q) => q.key === 'domein'));
});

test('zolang er niets gekozen is, staat er geen vervolgvraag', () => {
  const zichtbaar = visibleQuestions(techniek, {}).map((q) => q.key);
  assert.ok(zichtbaar.includes('heeft_domein'));
  assert.ok(!zichtbaar.includes('domein'));
  assert.ok(!zichtbaar.includes('domein_wens'));
});

test('verborgen verplichte velden tellen niet mee in de voortgang', () => {
  // Anders kan iemand die "Weet ik niet" kiest nooit op honderd procent komen.
  const zonder = requiredKeys({});
  const met = requiredKeys({ heeft_domein: 'Ja' });
  assert.deepEqual(zonder, met, 'geen van de vervolgvragen is verplicht');
  assert.ok(zonder.includes('heeft_domein'), 'de keuze zelf is dat wel');
});
