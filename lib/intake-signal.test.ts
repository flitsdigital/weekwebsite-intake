import { test } from 'node:test';
import assert from 'node:assert/strict';
import { intakeSignal, type SignalInput } from './intake-signal.ts';

process.env.TZ = 'Europe/Amsterdam';

// Woensdag 12 augustus 2026, 12:00 in Amsterdam.
const NU = Date.parse('2026-08-12T10:00:00Z');
const dagen = (n: number) => new Date(NU - n * 86_400_000).toISOString();

const input = (over: Partial<SignalInput> = {}): SignalInput => ({
  status: 'in_progress',
  openedAt: dagen(5),
  startedAt: dagen(5),
  lastCustomerActivityAt: dagen(0),
  currentStep: 2,
  now: NU,
  ...over,
});

test('nooit geopend is een ander probleem dan niet ingevuld', () => {
  const signal = intakeSignal(input({ openedAt: null, startedAt: null }));
  assert.equal(signal.kind, 'niet_geopend');
});

test('geopend maar niets ingevuld — daar bel je over', () => {
  const signal = intakeSignal(input({ startedAt: null, openedAt: dagen(3) }));
  assert.equal(signal.kind, 'niet_begonnen');
  assert.equal(signal.workingDays, 3);
});

test('vastlopen telt werkdagen, niet kalenderdagen', () => {
  // Vrijdag 7 augustus voor het laatst actief; het weekend telt niet mee.
  const signal = intakeSignal(input({ lastCustomerActivityAt: '2026-08-07T10:00:00Z' }));
  assert.equal(signal.kind, 'vast');
  assert.equal(signal.workingDays, 3, 'ma, di, wo — niet vijf');
  assert.equal(signal.step, 2, 'en je ziet meteen waar hij hangt');
});

test('twee werkdagen is nog geen vastlopen, drie wel', () => {
  assert.equal(intakeSignal(input({ lastCustomerActivityAt: dagen(2) })).kind, 'actief');
  assert.equal(intakeSignal(input({ lastCustomerActivityAt: dagen(3) })).kind, 'vast');
});

test('wie vandaag nog bezig was is gewoon actief', () => {
  assert.equal(intakeSignal(input()).kind, 'actief');
});

test('bij een status waar wij aan zet zijn geeft het signaal niets', () => {
  for (const status of ['submitted', 'building', 'review', 'live', 'cancelled']) {
    assert.equal(
      intakeSignal(input({ status, openedAt: null, startedAt: null })).kind,
      'niet_van_toepassing',
      `${status} hoort geen klantsignaal te geven`
    );
  }
});

test('zonder geregistreerde klantactiviteit valt hij terug op begonnen', () => {
  const signal = intakeSignal(input({ lastCustomerActivityAt: null, startedAt: dagen(9) }));
  assert.equal(signal.kind, 'vast');
});
