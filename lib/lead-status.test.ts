import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEAD_STATUSES, isOpen, leadDue, parseLeadStatus, responseMinutes } from './lead-status.ts';

process.env.TZ = 'Europe/Amsterdam';
const VANDAAG = '2026-08-12';

const lead = (over: Partial<Parameters<typeof leadDue>[0]> = {}) =>
  leadDue({ status: 'gesproken', nextActionAt: '2026-08-20', contactCount: 1, ...over }, VANDAAG);

test('niet_bereikt is geen leadstatus meer — dat is de uitkomst van één poging', () => {
  assert.deepEqual(LEAD_STATUSES, ['nieuw', 'gesproken', 'afspraak', 'gewonnen', 'verloren']);
  assert.equal(parseLeadStatus('niet_bereikt'), null);
});

test('een afgesloten lead vraagt niets meer', () => {
  assert.equal(isOpen('gewonnen'), false);
  assert.equal(isOpen('verloren'), false);
  assert.equal(lead({ status: 'gewonnen', nextActionAt: null, contactCount: 0 }), 'geen');
});

test('nog nooit benaderd en niets gepland: meteen aan de beurt', () => {
  assert.equal(lead({ status: 'nieuw', nextActionAt: null, contactCount: 0 }), 'nieuw');
});

test('drie keer tevergeefs gebeld is niet hetzelfde als onontdekt', () => {
  // Dit was de aanleiding: met de oude regel sprong zo iemand bovenaan alsof
  // je hem nog moest ontdekken.
  assert.equal(lead({ status: 'nieuw', nextActionAt: null, contactCount: 3 }), 'geen_vervolg');
});

test('een geplande datum wint van "nog nooit gebeld"', () => {
  // Je hebt bewust besloten hem volgende week te bellen; dat respecteren we.
  assert.equal(lead({ status: 'nieuw', nextActionAt: '2026-08-20', contactCount: 0 }), 'later');
  assert.equal(lead({ status: 'nieuw', nextActionAt: '2026-08-11', contactCount: 0 }), 'te_laat');
});

test('te laat, vandaag en later blijven drie verschillende dingen', () => {
  assert.equal(lead({ nextActionAt: '2026-08-11' }), 'te_laat');
  assert.equal(lead({ nextActionAt: VANDAAG }), 'vandaag');
  assert.equal(lead({ nextActionAt: '2026-08-13' }), 'later');
});

test('benaderd maar niets gepland is vergeten, niet klaar', () => {
  assert.equal(lead({ status: 'gesproken', nextActionAt: null, contactCount: 2 }), 'geen_vervolg');
});

test('reactietijd in minuten, want daar zit de conversie', () => {
  assert.equal(responseMinutes('2026-08-12T10:00:00Z', '2026-08-12T10:04:00Z'), 4);
  assert.equal(responseMinutes('2026-08-12T10:00:00Z', null), null, 'nog niet gebeld');
  assert.equal(
    responseMinutes('2026-08-12T10:00:00Z', '2026-08-12T09:00:00Z'),
    0,
    'klokverschil levert geen negatieve tijd op'
  );
});
