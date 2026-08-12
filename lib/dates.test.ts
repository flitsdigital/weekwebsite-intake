import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysSince, daysUntil, formatDate } from './dates.ts';

process.env.TZ = 'Europe/Amsterdam';

// Dinsdag 11 augustus, 12:00 in Amsterdam — precies de middag waar fromDbDate op mikt,
// zodat de dagafstanden hele getallen zijn en de test niet op een grens balanceert.
const NU = Date.parse('2026-08-11T10:00:00Z');

test('dagen sinds telt hele dagen, niet losse uren', () => {
  assert.equal(daysSince('2026-08-11T09:00:00Z', NU), 0);
  assert.equal(daysSince('2026-08-10T09:00:00Z', NU), 1);
  assert.equal(daysSince('2026-08-04T09:00:00Z', NU), 7);
  assert.equal(daysSince(null, NU), null);
});

test('dagen tot een opleverdatum', () => {
  assert.equal(daysUntil('2026-08-13', NU), 2);
  assert.equal(daysUntil('2026-08-11', NU), 0, 'een oplevering vandaag is nul dagen weg');
  assert.equal(daysUntil('2026-08-09', NU), -2, 'twee dagen over tijd');
  assert.equal(daysUntil(null, NU), null);
  assert.ok(daysUntil('2026-08-13', NU)! <= 2, 'valt binnen het dashboardblok');
});

test('een datum uit de database verschuift geen dag door de tijdzone', () => {
  // Zonder de middagtruc wordt dit in West-Europa 19 augustus.
  for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Auckland']) {
    process.env.TZ = tz;
    assert.match(formatDate('2026-08-20') ?? '', /20 aug/, `fout in ${tz}`);
  }
  process.env.TZ = 'Europe/Amsterdam';
});

test('een tijdstempel wordt ook leesbaar weergegeven', () => {
  assert.match(formatDate('2026-08-20T14:30:00Z') ?? '', /20 aug/);
  assert.equal(formatDate(null), null);
});
