import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEAD_STATUSES, isOpen, leadDue, parseLeadStatus, responseMinutes } from './lead-status.ts';

process.env.TZ = 'Europe/Amsterdam';
const VANDAAG = '2026-08-12';

const lead = (over: Partial<Parameters<typeof leadDue>[0]> = {}) =>
  leadDue({ status: 'gesproken', nextActionAt: '2026-08-20', ...over }, VANDAAG);

test('de levensloop staat vast en in procesvolgorde', () => {
  assert.deepEqual(LEAD_STATUSES, [
    'nieuw',
    'niet_bereikt',
    'gesproken',
    'afspraak',
    'gewonnen',
    'verloren',
  ]);
});

test('een afgesloten lead vraagt niets meer', () => {
  assert.equal(isOpen('gewonnen'), false);
  assert.equal(isOpen('verloren'), false);
  assert.equal(isOpen('nieuw'), true);
  assert.equal(lead({ status: 'gewonnen', nextActionAt: '2020-01-01' }), 'geen');
  assert.equal(lead({ status: 'verloren', nextActionAt: null }), 'geen');
});

test('een nieuwe lead is meteen aan de beurt — bel binnen 5 minuten', () => {
  assert.equal(lead({ status: 'nieuw', nextActionAt: null }), 'nieuw');
  assert.equal(
    lead({ status: 'nieuw', nextActionAt: '2026-09-01' }),
    'nieuw',
    'ook als er al iets gepland staat: hij is nog nooit gebeld'
  );
});

test('een open lead zonder vervolgactie is vergeten, niet klaar', () => {
  assert.equal(lead({ status: 'gesproken', nextActionAt: null }), 'geen_vervolg');
  assert.equal(lead({ status: 'niet_bereikt', nextActionAt: null }), 'geen_vervolg');
});

test('te laat, vandaag en later zijn drie verschillende dingen', () => {
  assert.equal(lead({ nextActionAt: '2026-08-11' }), 'te_laat');
  assert.equal(lead({ nextActionAt: VANDAAG }), 'vandaag');
  assert.equal(lead({ nextActionAt: '2026-08-13' }), 'later');
});

test('parseLeadStatus is de rand waar een databasestring een status wordt', () => {
  assert.equal(parseLeadStatus('afspraak'), 'afspraak');
  assert.equal(parseLeadStatus('onzin'), null);
  assert.equal(parseLeadStatus(null), null);
});

test('reactietijd in minuten, want daar zit de conversie', () => {
  assert.equal(
    responseMinutes('2026-08-12T10:00:00Z', '2026-08-12T10:04:00Z'),
    4,
    'binnen vijf minuten gebeld'
  );
  assert.equal(responseMinutes('2026-08-12T10:00:00Z', '2026-08-13T10:00:00Z'), 1440);
  assert.equal(responseMinutes('2026-08-12T10:00:00Z', null), null, 'nog niet gebeld');
  assert.equal(
    responseMinutes('2026-08-12T10:00:00Z', '2026-08-12T09:00:00Z'),
    0,
    'klokverschil levert geen negatieve tijd op'
  );
});
