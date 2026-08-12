import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeHref } from './nav-active.ts';

const MENU = ['/admin', '/admin/bord', '/admin/klanten', '/admin/klanten/nieuw'];
const ROOT = ['/admin'];
const actief = (pathname: string) => activeHref(pathname, MENU, ROOT);

test('de langste match wint, dus maar één item licht op', () => {
  // Dit ging mis: met startsWith lichtten "Klanten" en "Nieuwe klant" allebei op.
  assert.equal(actief('/admin/klanten/nieuw'), '/admin/klanten/nieuw');
});

test('een klantpagina hoort bij Klanten, niet bij Nieuwe klant', () => {
  assert.equal(actief('/admin/klanten/abc-123'), '/admin/klanten');
});

test('het dashboard matcht alleen zichzelf', () => {
  assert.equal(actief('/admin'), '/admin');
  assert.equal(actief('/admin/bord'), '/admin/bord');
});

test('een toekomstige adminpagina laat het dashboard niet oplichten', () => {
  assert.equal(actief('/admin/instellingen'), undefined);
});

test('een langere naam die toevallig begint met een menupad telt niet', () => {
  assert.equal(actief('/admin/klantenservice'), undefined);
});
