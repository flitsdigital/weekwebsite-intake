import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Wordt vanuit de browser aangeroepen, niet bij het renderen op de server:
 * WhatsApp, iMessage en Slack halen links vooraf op voor een voorbeeldje en
 * voeren daarbij geen JavaScript uit. Anders stond elke intake op "geopend"
 * zodra jij de link verstuurde.
 *
 * Schrijft alleen als het veld nog leeg is, dus terugkomen verandert niets.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (typeof body?.token !== 'string' || !body.token) {
    return new Response(null, { status: 400 });
  }

  await supabaseAdmin
    .from('intakes')
    .update({ opened_at: new Date().toISOString() })
    .eq('token', body.token)
    .is('opened_at', null);

  return new Response(null, { status: 204 });
}
