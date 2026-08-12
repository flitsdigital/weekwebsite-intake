import { supabaseAdmin } from '@/lib/supabase-admin';
import { openIntake } from '@/lib/intake';
import { EDITABLE } from '@/lib/intake-status';
import { listIntakeFiles, supabaseFileStore } from '@/lib/intake-files';

const SIGNED_URL_DAYS = 7;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const intake = await openIntake(body?.token);
  if (!intake) return Response.json({ error: 'Deze intake is al verzonden.' }, { status: 409 });

  // Zeven wérkdagen, niet zeven kalenderdagen — anders valt de oplevering in het weekend.
  const { data: deadline } = await supabaseAdmin.rpc('add_working_days', {
    start_date: new Date().toISOString().slice(0, 10),
    days: 7,
  });

  const { data, error } = await supabaseAdmin
    .from('intakes')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      deadline_at: deadline,
    })
    .eq('id', intake.id)
    .in('status', EDITABLE)
    .select('id, company_name, contact_name, phone, email, deadline_at, answers')
    .maybeSingle();

  if (error || !data) {
    return Response.json({ error: 'Verzenden lukte niet.' }, { status: 500 });
  }

  await notify(data);
  return Response.json({ ok: true, deadline_at: data.deadline_at });
}

/** n8n maakt de mail. Mislukt dit, dan is de intake nog steeds verzonden. */
async function notify(intake: {
  id: string;
  company_name: string;
  deadline_at: string | null;
  answers: unknown;
}) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.warn('N8N_WEBHOOK_URL ontbreekt — melding voor', intake.company_name, 'niet verstuurd');
    return;
  }

  const files = await listIntakeFiles(
    supabaseFileStore(supabaseAdmin),
    intake.id,
    SIGNED_URL_DAYS * 86400
  );

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        intake: {
          ...intake,
          admin_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/klanten/${intake.id}`,
        },
        files: files
          .filter((file) => file.url)
          .map((file) => ({
            kind: file.kind,
            name: file.name,
            url: file.url,
            expires_in_days: SIGNED_URL_DAYS,
          })),
      }),
    });
  } catch (e) {
    console.error('n8n-webhook mislukt voor', intake.company_name, e);
  }
}
