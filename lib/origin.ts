import { headers } from 'next/headers';

// Lokaal, preview en productie hebben elk hun eigen URL. Uit het request lezen scheelt
// een omgevingsvariabele die je bij elke nieuwe omgeving weer moet bijwerken.
export async function origin() {
  const h = await headers();
  return `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
}
