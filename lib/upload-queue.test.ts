import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUploadQueue, type RunJob } from './upload-queue.ts';

/** Job die pas klaar is als de test hem loslaat, zodat gelijktijdigheid meetbaar is. */
function deferred() {
  let resolve!: () => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test('start niet meer dan het plafond tegelijk', () => {
  const queue = createUploadQueue(2);
  const gates = [deferred(), deferred(), deferred(), deferred()];
  const started: string[] = [];

  gates.forEach((gate, i) => {
    const run: RunJob = () => {
      started.push(`job${i}`);
      return gate.promise;
    };
    queue.add(`job${i}`, run);
  });

  assert.deepEqual(started, ['job0', 'job1'], 'derde en vierde moeten wachten');
  assert.equal(queue.inFlight(), 2);
});

test('een vrijgekomen plek gaat naar de volgende in de rij', async () => {
  const queue = createUploadQueue(2);
  const gates = [deferred(), deferred(), deferred()];
  const started: string[] = [];

  gates.forEach((gate, i) =>
    queue.add(`job${i}`, () => {
      started.push(`job${i}`);
      return gate.promise;
    })
  );

  gates[0].resolve();
  await new Promise((r) => setImmediate(r));

  assert.deepEqual(started, ['job0', 'job1', 'job2']);
  assert.equal(queue.jobs().find((j) => j.key === 'job0')?.state, 'klaar');
});

test('een mislukte job blokkeert de rij niet en is opnieuw te proberen', async () => {
  const queue = createUploadQueue(1);
  let pogingen = 0;

  queue.add('flaky', () => {
    pogingen++;
    return pogingen === 1 ? Promise.reject(new Error('netwerk')) : Promise.resolve();
  });
  queue.add('volgende', () => Promise.resolve());

  await new Promise((r) => setTimeout(r, 0));
  assert.equal(queue.jobs().find((j) => j.key === 'flaky')?.state, 'fout');
  assert.equal(queue.jobs().find((j) => j.key === 'volgende')?.state, 'klaar');

  queue.retry('flaky');
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(pogingen, 2);
  assert.equal(queue.jobs().find((j) => j.key === 'flaky')?.state, 'klaar');
});

test('annuleren haalt een wachtende job weg zonder hem te draaien', () => {
  const queue = createUploadQueue(1);
  let gedraaid = false;

  queue.add('bezet', () => deferred().promise);
  queue.add('wachtend', () => {
    gedraaid = true;
    return Promise.resolve();
  });

  queue.cancel('wachtend');

  assert.equal(gedraaid, false);
  assert.equal(queue.jobs().some((j) => j.key === 'wachtend'), false);
});

test('annuleren breekt een lopende job af, zodat het resultaat vervalt', async () => {
  const queue = createUploadQueue(1);
  const gate = deferred();
  let signal: AbortSignal | undefined;
  let afgerond = false;

  queue.add('lopend', (ctx) => {
    signal = ctx.signal;
    return gate.promise.then(() => {
      afgerond = true;
    });
  });

  queue.cancel('lopend');
  assert.equal(signal?.aborted, true, 'de job moet een afgebroken signaal krijgen');

  gate.resolve();
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(afgerond, true, 'de belofte zelf loopt af');
  assert.equal(queue.jobs().some((j) => j.key === 'lopend'), false, 'maar hij telt niet meer mee');
  assert.equal(queue.inFlight(), 0, 'en geeft zijn plek vrij');
});

test('voortgang komt door bij de luisteraar', async () => {
  const queue = createUploadQueue(1);
  const gate = deferred();
  let meldingen = 0;
  queue.subscribe(() => meldingen++);

  queue.add('job', (ctx) => {
    ctx.onProgress(40);
    ctx.onProgress(90);
    return gate.promise;
  });

  assert.equal(queue.jobs().find((j) => j.key === 'job')?.progress, 90);
  assert.ok(meldingen >= 3, 'toevoegen, starten en elke voortgangsstap melden');

  gate.resolve();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(queue.jobs().find((j) => j.key === 'job')?.progress, 100);
});

test('de momentopname blijft dezelfde referentie tot er iets verandert', () => {
  const queue = createUploadQueue(1);
  const eerst = queue.jobs();
  assert.equal(queue.jobs(), eerst, 'anders blijft useSyncExternalStore hertekenen');

  queue.add('job', () => deferred().promise);
  assert.notEqual(queue.jobs(), eerst);
});

test('twee uploadzones die dezelfde wachtrij delen halen samen het plafond niet voorbij', () => {
  const gedeeld = createUploadQueue(2);
  const started: string[] = [];
  const maak = (zone: string) => (i: number) =>
    gedeeld.add(`${zone}-${i}`, () => {
      started.push(`${zone}-${i}`);
      return deferred().promise;
    });

  [0, 1].forEach(maak('logo'));
  [0, 1].forEach(maak('fotos'));

  assert.equal(started.length, 2, 'stap 3 rendert twee zones; samen mogen ze er twee tegelijk doen');
  assert.equal(gedeeld.inFlight(), 2);
});
