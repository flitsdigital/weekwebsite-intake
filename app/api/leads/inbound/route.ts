import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseLeadPayload } from '@/lib/lead-payload';

/**
 * Waar Zapier de Facebook-leads naartoe stuurt.
 *
 * Beveiligd met een gedeeld geheim in een header. Een niet-raadbaar adres is
 * niet genoeg: dat komt in de geschiedenis van Zapier, in logboeken en in
 * screenshots terecht. Een geheim kun je bovendien draaien zonder de Zap
 * opnieuw te bouwen.
 */
export async function POST(req: Request) {
  const secret = process.env.LEADS_WEBHOOK_SECRET;
  if (!secret) {
    console.error('LEADS_WEBHOOK_SECRET ontbreekt — inkomende leads worden geweigerd');
    return new Response(null, { status: 503 });
  }

  // Geen uitleg terug: wie het geheim niet heeft, hoort ook niet te weten wat er miste.
  if (req.headers.get('x-weekwebsite-secret') !== secret) {
    return new Response(null, { status: 401 });
  }

  const lead = parseLeadPayload(await req.json().catch(() => null));
  if (!lead) {
    // Een testaanroep van Zapier bevat vaak niets herkenbaars. Dat is geen fout
    // aan hun kant, dus geen 4xx — anders blijft Zapier het opnieuw proberen.
    return Response.json({ ok: true, opgeslagen: false, reden: 'geen herkenbare velden' });
  }

  if (lead.externalId) {
    const { data: bestaand } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('external_id', lead.externalId)
      .maybeSingle();

    // Stil goedkeuren bij een herhaalpoging, anders blijft Zapier hameren.
    if (bestaand) return Response.json({ ok: true, opgeslagen: false, reden: 'al bekend' });
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      external_id: lead.externalId,
      company_name: lead.companyName,
      contact_name: lead.contactName,
      phone: lead.phone,
      email: lead.email,
      raw: lead.raw,
    })
    .select('id')
    .single();

  if (error) {
    // Botsing op external_id: twee aanroepen tegelijk. Ook dat is geen fout.
    if (error.code === '23505') {
      return Response.json({ ok: true, opgeslagen: false, reden: 'al bekend' });
    }
    console.error('lead opslaan mislukt', error);
    return new Response(null, { status: 500 });
  }

  return Response.json({ ok: true, opgeslagen: true, id: data.id });
}
