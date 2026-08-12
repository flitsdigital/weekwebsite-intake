/**
 * De allowlist-check van de backoffice. Een sessie is niet genoeg: wie zichzelf
 * bij Supabase Auth registreert komt er zonder rij in `admins` niet in.
 *
 * Staat los van `supabase-admin` omdat de middleware op de Edge-runtime draait
 * en `server-only` daar niet importeerbaar is. Dit is de tweede — en enige andere —
 * plek waar de service-key gelezen wordt; zie CLAUDE.md.
 */
export function createAllowlist({
  url,
  serviceKey,
  fetchImpl = fetch,
}: {
  url: string;
  serviceKey: string;
  fetchImpl?: typeof fetch;
}) {
  return async function mayEnter(email: string): Promise<boolean> {
    if (!email) return false;

    try {
      const response = await fetchImpl(
        `${url}/rest/v1/admins?select=email&email=eq.${encodeURIComponent(email)}`,
        {
          headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
          cache: 'no-store',
        }
      );

      if (!response.ok) return false;

      const rows: unknown = await response.json();
      return Array.isArray(rows) && rows.length > 0;
    } catch {
      // Bij twijfel dicht: liever iemand onterecht buiten dan onterecht binnen.
      return false;
    }
  };
}
