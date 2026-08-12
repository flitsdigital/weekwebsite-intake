import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFunnel, type FunnelRow } from './funnel.ts';

const row = (over: Partial<FunnelRow> = {}): FunnelRow => ({
  created_at: '2026-08-01T10:00:00Z',
  opened_at: null,
  started_at: null,
  submitted_at: null,
  max_step_reached: 1,
  ...over,
});

test('zonder intakes zijn alle stadia nul, niet NaN', () => {
  const stages = buildFunnel([]);
  assert.equal(stages.length, 8);
  assert.ok(stages.every((s) => s.count === 0 && s.percent === 0));
});

test('percentages zijn van "aangemaakt", niet van de vorige stap', () => {
  const rows = [
    row({ opened_at: 'x', started_at: 'x', submitted_at: 'x', max_step_reached: 5 }),
    row({ opened_at: 'x', started_at: 'x', max_step_reached: 3 }),
    row({ opened_at: 'x' }),
    row(),
  ];
  const stages = buildFunnel(rows);
  const find = (key: string) => stages.find((s) => s.key === key)!;

  assert.equal(find('aangemaakt').count, 4);
  assert.equal(find('geopend').count, 3);
  assert.equal(find('geopend').percent, 75);
  assert.equal(find('verzonden').count, 1);
  assert.equal(find('verzonden').percent, 25);
});

test('stap-stadia tellen iedereen die minstens zover kwam', () => {
  const rows = [row({ max_step_reached: 5 }), row({ max_step_reached: 3 }), row({ max_step_reached: 2 })];
  const stages = buildFunnel(rows);
  const count = (key: string) => stages.find((s) => s.key === key)!.count;

  assert.equal(count('stap2'), 3);
  assert.equal(count('stap3'), 2);
  assert.equal(count('stap4'), 1);
  assert.equal(count('stap5'), 1);
});

test('begonnen zonder geopend telt toch als geopend', () => {
  // Kan gebeuren bij uitgeschakelde JavaScript. Een trechter die krimpt en
  // daarna groeit is onleesbaar, dus beginnen impliceert openen.
  const stages = buildFunnel([row({ started_at: 'x', max_step_reached: 2 })]);
  assert.equal(stages.find((s) => s.key === 'geopend')!.count, 1);
});

test('de trechter loopt nooit omhoog', () => {
  const rows = [
    row({ opened_at: 'x', started_at: 'x', submitted_at: 'x', max_step_reached: 5 }),
    row({ opened_at: 'x', started_at: 'x', max_step_reached: 4 }),
    row({ opened_at: 'x' }),
    row(),
    row(),
  ];
  const counts = buildFunnel(rows).map((s) => s.count);
  for (let i = 1; i < counts.length; i++) {
    assert.ok(counts[i] <= counts[i - 1], `stadium ${i} is groter dan het vorige`);
  }
});

test('afgehaakte intakes tellen mee — dat is juist de dure uitkomst', () => {
  const stages = buildFunnel([row({ opened_at: 'x' }), row({ opened_at: 'x' })]);
  assert.equal(stages.find((s) => s.key === 'aangemaakt')!.count, 2);
});
