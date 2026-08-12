import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUSES,
  EDITABLE,
  WAITING,
  isEditable,
  isWaiting,
  needsAttention,
  parseStatus,
} from './intake-status.ts';

test('de volgorde volgt het proces uit de PRD', () => {
  assert.deepEqual(STATUSES, [
    'new',
    'in_progress',
    'submitted',
    'building',
    'review',
    'live',
    'cancelled',
  ]);
});

test('bewerkbaar is precies new en in_progress', () => {
  assert.deepEqual([...EDITABLE], ['new', 'in_progress']);
  assert.equal(isEditable('new'), true);
  assert.equal(isEditable('in_progress'), true);
  assert.equal(isEditable('submitted'), false);
  assert.equal(isEditable('live'), false);
});

test('wachten op materiaal is een eigen begrip, geen alias van bewerkbaar', () => {
  // Vandaag dezelfde waarden, maar twee regels. Ze mogen los uit elkaar groeien.
  assert.notEqual(EDITABLE, WAITING, 'niet dezelfde constante hergebruiken');
  assert.equal(isWaiting('in_progress'), true);
  assert.equal(isWaiting('building'), false);
});

test('aandacht nodig is wachten én langer dan twee dagen stil (SPEC hoofdstuk 6)', () => {
  assert.equal(needsAttention('in_progress', 3), true);
  assert.equal(needsAttention('in_progress', 2), false, 'twee dagen is nog niet te lang');
  assert.equal(needsAttention('new', 9), true);
  assert.equal(needsAttention('building', 30), false, 'wij zijn aan zet, niet de klant');
  assert.equal(needsAttention('cancelled', 99), false);
});

test('parseStatus is de enige plek waar een databasestring een status wordt', () => {
  assert.equal(parseStatus('building'), 'building');
  assert.equal(parseStatus('onzin'), null);
  assert.equal(parseStatus(null), null);
  assert.equal(parseStatus(42), null);
});
