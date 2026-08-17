import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysSince, daysUntil, formatDate, timeAgo, workingDaysBetween } from './dates.ts';

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

test('werkdagen slaan het weekend over', () => {
  const vrijdag = Date.parse('2026-08-07T10:00:00Z');
  const zaterdag = Date.parse('2026-08-08T10:00:00Z');
  const maandag = Date.parse('2026-08-10T10:00:00Z');
  const woensdag = Date.parse('2026-08-12T10:00:00Z');

  assert.equal(workingDaysBetween(vrijdag, vrijdag), 0, 'dezelfde dag');
  assert.equal(workingDaysBetween(vrijdag, zaterdag), 0, 'zaterdag telt niet');
  assert.equal(workingDaysBetween(vrijdag, maandag), 1, 'alleen maandag');
  assert.equal(workingDaysBetween(vrijdag, woensdag), 3, 'ma, di, wo');
  assert.equal(workingDaysBetween(maandag, woensdag), 2);
});

test('werkdagen tellen niet terug', () => {
  const maandag = Date.parse('2026-08-10T10:00:00Z');
  const vrijdag = Date.parse('2026-08-07T10:00:00Z');
  assert.equal(workingDaysBetween(maandag, vrijdag), 0);
});

test('hoe lang geleden een lead binnenkwam', () => {
  const geleden = (ms: number) => new Date(NU - ms).toISOString();

  assert.equal(timeAgo(geleden(30_000), NU), 'net binnen');
  assert.equal(timeAgo(geleden(4 * 60_000), NU), '4 min geleden');
  assert.equal(timeAgo(geleden(59 * 60_000), NU), '59 min geleden');
  assert.equal(timeAgo(geleden(60 * 60_000), NU), '1 uur geleden');
  assert.equal(timeAgo(geleden(25 * 3600_000), NU), 'gisteren');
  assert.equal(timeAgo(geleden(5 * 86_400_000), NU), '5 dagen geleden');
  assert.equal(timeAgo(geleden(70 * 86_400_000), NU), '2 maanden geleden');
});

test('een tijdstempel wordt ook leesbaar weergegeven', () => {
  assert.match(formatDate('2026-08-20T14:30:00Z') ?? '', /20 aug/);
  assert.equal(formatDate(null), null);
});
