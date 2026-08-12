import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLeadPayload } from './lead-payload.ts';

test('herkent de velden zoals Facebook ze noemt', () => {
  const lead = parseLeadPayload({
    leadgen_id: '9912837',
    company_name: 'Kuipers Installatie',
    full_name: 'Henk Kuipers',
    phone_number: '0591 123456',
    email: 'henk@kuipers.nl',
  });

  assert.deepEqual(
    { ...lead, raw: undefined },
    {
      externalId: '9912837',
      companyName: 'Kuipers Installatie',
      contactName: 'Henk Kuipers',
      phone: '0591 123456',
      email: 'henk@kuipers.nl',
      raw: undefined,
    }
  );
});

test('herkent ze ook zoals Zapier ze doorgeeft, met hoofdletters en spaties', () => {
  const lead = parseLeadPayload({
    'Lead ID': '55',
    'Company Name': 'Hoveniersbedrijf De Vries',
    'Full Name': 'Piet de Vries',
    'Phone Number': '0592 445566',
    Email: 'piet@devries.nl',
  });

  assert.equal(lead?.externalId, '55');
  assert.equal(lead?.companyName, 'Hoveniersbedrijf De Vries');
  assert.equal(lead?.phone, '0592 445566');
});

test('Nederlandse veldnamen werken ook', () => {
  const lead = parseLeadPayload({
    bedrijfsnaam: 'Dakkapellen Emmen',
    naam: 'Karin Bos',
    telefoonnummer: '0591 998877',
    emailadres: 'karin@dakkapellen.nl',
  });

  assert.equal(lead?.companyName, 'Dakkapellen Emmen');
  assert.equal(lead?.contactName, 'Karin Bos');
  assert.equal(lead?.phone, '0591 998877');
  assert.equal(lead?.email, 'karin@dakkapellen.nl');
});

test('bewaart altijd de hele oorspronkelijke payload', () => {
  const body = { bedrijfsnaam: 'X', wat_is_je_grootste_wens: 'meer bellers', campagne: 'zomer' };
  const lead = parseLeadPayload(body);

  assert.deepEqual(lead?.raw, body, 'anders ben je een formulierwijziging kwijt');
});

test('lege waarden en spaties worden niets, geen lege string', () => {
  const lead = parseLeadPayload({ bedrijfsnaam: '   ', telefoon: '', naam: ' Henk ' });

  assert.equal(lead?.companyName, null);
  assert.equal(lead?.phone, null);
  assert.equal(lead?.contactName, 'Henk', 'wel netjes bijgeknipt');
});

test('zonder lead-id kan het ook — met de hand ingevoerde leads hebben er geen', () => {
  const lead = parseLeadPayload({ bedrijfsnaam: 'Garage Wolters' });
  assert.equal(lead?.externalId, null);
});

test('getallen worden tekst, want een telefoonnummer is geen getal', () => {
  const lead = parseLeadPayload({ leadgen_id: 9912837, telefoon: 592445566 });
  assert.equal(lead?.externalId, '9912837');
  assert.equal(lead?.phone, '592445566');
});

test('rommel levert niets op in plaats van een halve lead', () => {
  assert.equal(parseLeadPayload(null), null);
  assert.equal(parseLeadPayload('tekst'), null);
  assert.equal(parseLeadPayload([1, 2]), null);
});

test('een payload zonder enig herkenbaar veld telt niet als lead', () => {
  // Anders maak je een lege rij aan bij elke testaanroep van Zapier.
  assert.equal(parseLeadPayload({ foo: 'bar' }), null);
});
