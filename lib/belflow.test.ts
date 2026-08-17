import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BELFLOW, START, isEnding } from './belflow.ts';

test('elke keuze wijst naar een bestaande knoop', () => {
  for (const [id, node] of Object.entries(BELFLOW)) {
    if (isEnding(node)) continue;
    for (const option of node.options) {
      assert.ok(BELFLOW[option.to], `${id} verwijst naar ${option.to}, en die bestaat niet`);
    }
  }
});

test('elke knoop is bereikbaar vanaf de start', () => {
  const seen = new Set([START]);
  const queue = [START];

  while (queue.length) {
    const node = BELFLOW[queue.shift()!];
    if (isEnding(node)) continue;
    for (const { to } of node.options) {
      if (!seen.has(to)) {
        seen.add(to);
        queue.push(to);
      }
    }
  }

  assert.deepEqual(
    Object.keys(BELFLOW).filter((id) => !seen.has(id)),
    [],
    'deze knopen zijn vanaf de start niet te bereiken'
  );
});

test('geen enkel gesprek loopt dood', () => {
  for (const [id, node] of Object.entries(BELFLOW)) {
    if (!isEnding(node)) {
      assert.ok(node.options.length > 0, `${id} heeft geen keuzes en is geen eindpunt`);
    }
  }
});
