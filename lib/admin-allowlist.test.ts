import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAllowlist } from './admin-allowlist.ts';

function stub(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: string[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push(String(url));
    return handler(String(url), init);
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function allowlist(handler: Parameters<typeof stub>[0]) {
  const { calls, fetchImpl } = stub(handler);
  return {
    calls,
    mayEnter: createAllowlist({
      url: 'https://project.supabase.co',
      serviceKey: 'geheim',
      fetchImpl,
    }),
  };
}

test('een adres met een rij in admins mag naar binnen', async () => {
  const { mayEnter } = allowlist(() => json([{ email: 'jordi@flitsdigital.nl' }]));
  assert.equal(await mayEnter('jordi@flitsdigital.nl'), true);
});

test('een adres zonder rij mag er niet in, ook met een geldige sessie', async () => {
  const { mayEnter } = allowlist(() => json([]));
  assert.equal(await mayEnter('vreemde@example.com'), false);
});

test('een foutstatus sluit de deur in plaats van hem open te zetten', async () => {
  const { mayEnter } = allowlist(() => json({ message: 'kapot' }, 500));
  assert.equal(await mayEnter('jordi@flitsdigital.nl'), false);
});

test('een netwerkfout sluit de deur ook', async () => {
  const { mayEnter } = allowlist(() => Promise.reject(new Error('geen verbinding')));
  assert.equal(await mayEnter('jordi@flitsdigital.nl'), false);
});

test('onzin terug uit de database telt niet als toegang', async () => {
  const { mayEnter } = allowlist(() => json({ niet: 'een lijst' }));
  assert.equal(await mayEnter('jordi@flitsdigital.nl'), false);
});

test('een leeg adres vraagt niets aan de database', async () => {
  const { calls, mayEnter } = allowlist(() => json([{ email: 'x' }]));
  assert.equal(await mayEnter(''), false);
  assert.equal(calls.length, 0);
});

test('bijzondere tekens in een adres worden gecodeerd, niet doorgegeven', async () => {
  const { calls, mayEnter } = allowlist(() => json([]));
  await mayEnter('jordi+admin@flitsdigital.nl');

  assert.match(calls[0], /email=eq\.jordi%2Badmin%40flitsdigital\.nl/);
  assert.ok(!calls[0].includes('+admin@'), 'anders leest PostgREST de plus als spatie');
});

test('de service-key gaat mee als sleutel én als bearer', async () => {
  let headers: Record<string, string> = {};
  const { fetchImpl } = stub((_url, init) => {
    headers = (init?.headers ?? {}) as Record<string, string>;
    return json([]);
  });
  const mayEnter = createAllowlist({
    url: 'https://project.supabase.co',
    serviceKey: 'geheim',
    fetchImpl,
  });

  await mayEnter('x@y.nl');
  assert.equal(headers.apikey, 'geheim');
  assert.equal(headers.authorization, 'Bearer geheim');
});
