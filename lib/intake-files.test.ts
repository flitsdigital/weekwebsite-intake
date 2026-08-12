import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listIntakeFiles, type FileStore } from './intake-files.ts';

type Row = { id: string; kind: string; storage_path: string; original_name: string | null };

function store(
  rows: Row[],
  signer: (paths: string[], expiresIn: number) => { path?: string; signedUrl?: string | null }[] | null
): FileStore & { gevraagd: { paths: string[]; expiresIn: number }[] } {
  const gevraagd: { paths: string[]; expiresIn: number }[] = [];
  return {
    gevraagd,
    rowsFor: async () => rows,
    signPaths: async (paths, expiresIn) => {
      gevraagd.push({ paths, expiresIn });
      return signer(paths, expiresIn);
    },
  };
}

const rows: Row[] = [
  { id: 'a', kind: 'logo', storage_path: 'i/logo/a.jpg', original_name: 'logo.jpg' },
  { id: 'b', kind: 'photo', storage_path: 'i/photos/b.jpg', original_name: 'werk1.jpg' },
  { id: 'c', kind: 'photo', storage_path: 'i/photos/c.jpg', original_name: 'werk2.jpg' },
];

test('koppelt op pad, niet op volgorde', async () => {
  // De opslag geeft ze in omgekeerde volgorde terug.
  const db = store(rows, (paths) =>
    [...paths].reverse().map((path) => ({ path, signedUrl: `https://x/${path}` }))
  );

  const files = await listIntakeFiles(db, 'i', 3600);

  assert.deepEqual(
    files.map((f) => [f.name, f.url]),
    [
      ['logo.jpg', 'https://x/i/logo/a.jpg'],
      ['werk1.jpg', 'https://x/i/photos/b.jpg'],
      ['werk2.jpg', 'https://x/i/photos/c.jpg'],
    ]
  );
});

test('een kortere antwoordlijst maakt alleen dat ene bestand null', async () => {
  const db = store(rows, (paths) =>
    paths.slice(0, 2).map((path) => ({ path, signedUrl: `https://x/${path}` }))
  );

  const files = await listIntakeFiles(db, 'i', 3600);

  assert.deepEqual(files.map((f) => f.url !== null), [true, true, false]);
  assert.equal(files[2].name, 'werk2.jpg', 'de ontbrekende is werk2, niet een willekeurige');
});

test('een fout per bestand levert null op, geen kapotte link', async () => {
  const db = store(rows, (paths) =>
    paths.map((path, i) => (i === 1 ? { path, signedUrl: null } : { path, signedUrl: `https://x/${path}` }))
  );

  const files = await listIntakeFiles(db, 'i', 3600);
  assert.equal(files[1].url, null);
  assert.equal(files[1].name, 'werk1.jpg');
});

test('valt de ondertekening helemaal weg, dan is alles null in plaats van stuk', async () => {
  const db = store(rows, () => null);
  const files = await listIntakeFiles(db, 'i', 3600);
  assert.deepEqual(files.map((f) => f.url), [null, null, null]);
});

test('zonder bestanden wordt er niet ondertekend', async () => {
  const db = store([], () => []);
  const files = await listIntakeFiles(db, 'i', 3600);

  assert.deepEqual(files, []);
  assert.equal(db.gevraagd.length, 0, 'een lege ondertekenaanroep is verspilde tijd');
});

test('de geldigheidsduur gaat mee zoals de aanroeper hem vraagt', async () => {
  const db = store(rows, (paths) => paths.map((path) => ({ path, signedUrl: 'x' })));
  await listIntakeFiles(db, 'i', 7 * 86400);

  assert.equal(db.gevraagd[0].expiresIn, 604800, 'de webhook vraagt zeven dagen');
});

test('een bestand zonder naam krijgt een leesbare vervanging', async () => {
  const naamloos: Row[] = [{ id: 'a', kind: 'photo', storage_path: 'i/photos/a.jpg', original_name: null }];
  const db = store(naamloos, (paths) => paths.map((path) => ({ path, signedUrl: 'x' })));

  const files = await listIntakeFiles(db, 'i', 60);
  assert.equal(files[0].name, 'bestand');
});
