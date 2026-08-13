import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveSource, sourceLabel } from './lead-source.ts';

test('een expliciete bron wint altijd', () => {
  assert.equal(deriveSource({ bron: 'website' }), 'website');
  assert.equal(deriveSource({ source: 'facebook' }), 'facebook');
  assert.equal(deriveSource({ Bron: 'Handmatig' }), 'handmatig', 'hoofdletters maken niet uit');
});

test('bekende omschrijvingen worden herkend, niet letterlijk overgenomen', () => {
  assert.equal(deriveSource({ bron: 'weekwebsite.nl intake-modal' }), 'website');
  assert.equal(deriveSource({ bron: 'Facebook Lead Ads' }), 'facebook');
});

test('een leadgen_id is de handtekening van Facebook', () => {
  assert.equal(deriveSource({ leadgen_id: '99123', naam: 'Henk' }), 'facebook');
  assert.equal(deriveSource({ 'Lead ID': '55' }), 'facebook');
});

test('een expliciete bron gaat vóór het raden', () => {
  // Komt er ooit een kanaal dat ook een lead-id meestuurt, dan bepaalt de bron.
  assert.equal(deriveSource({ leadgen_id: '1', bron: 'website' }), 'website');
});

test('zonder aanwijzing is het onbekend, niet stiekem website', () => {
  assert.equal(deriveSource({ naam: 'Henk' }), 'onbekend');
  assert.equal(deriveSource({}), 'onbekend');
  assert.equal(deriveSource(null), 'onbekend');
});

test('een nieuw kanaal wordt bewaard in plaats van weggegooid', () => {
  // Geen check-constraint op de kolom: een onbekende bron mag nooit een lead kosten.
  assert.equal(deriveSource({ bron: 'Google Ads' }), 'google-ads');
  assert.equal(deriveSource({ bron: '  Beurs  Emmen ' }), 'beurs-emmen');
});

test('labels: bekende bronnen netjes, onbekende leesbaar genoeg', () => {
  assert.equal(sourceLabel('website'), 'Website');
  assert.equal(sourceLabel('facebook'), 'Facebook');
  assert.equal(sourceLabel('handmatig'), 'Handmatig ingevoerd');
  assert.equal(sourceLabel('onbekend'), 'Onbekend');
  assert.equal(sourceLabel('google-ads'), 'google-ads', 'liever de ruwe waarde dan niets');
});
