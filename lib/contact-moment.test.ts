import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactLabel, parseChannel, parseContact, parseOutcome } from './contact-moment.ts';

test('kanaal en uitkomst worden aan de rand gecontroleerd', () => {
  assert.equal(parseChannel('telefoon'), 'telefoon');
  assert.equal(parseChannel('duif'), null);
  assert.equal(parseOutcome('voicemail'), 'voicemail');
  assert.equal(parseOutcome('onzin'), null);
});

test('een halve invulling is geen contactmoment', () => {
  // De database weigert hem toch; hier gooien we hem weg vóór dat gebeurt.
  assert.equal(parseContact('telefoon', null), null);
  assert.equal(parseContact(null, 'gesproken'), null);
  assert.equal(parseContact('telefoon', 'onzin'), null);
});

test('allebei ingevuld levert een contactmoment', () => {
  assert.deepEqual(parseContact('whatsapp', 'verstuurd'), {
    channel: 'whatsapp',
    outcome: 'verstuurd',
  });
});

test('niets ingevuld is een losse aantekening, geen fout', () => {
  assert.equal(parseContact(null, null), null);
  assert.equal(parseContact('', ''), null);
});

test('het label leest als een zin', () => {
  assert.equal(contactLabel('telefoon', 'niet_opgenomen'), 'Gebeld — niet opgenomen');
  assert.equal(contactLabel('langsgeweest', 'afspraak'), 'Langsgeweest — afspraak gemaakt');
  assert.equal(contactLabel(null, null), null, 'losse aantekening krijgt geen kopregel');
});
