import { supabaseAdmin } from '@/lib/supabase-admin';
import { EDITABLE } from '@/lib/intake-status';
import { STEPS, TOTAL_STEPS } from '@/lib/questions';

const VALID_KEYS = new Set(STEPS.flatMap((s) => s.questions.map((q) => q.key)));

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.token !== 'string') {
    return Response.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const step = Number(body.step);
  if (!Number.isInteger(step) || step < 1 || step > TOTAL_STEPS) {
    return Response.json({ error: 'Ongeldige stap.' }, { status: 400 });
  }

  // Alleen bekende sleutels met tekstwaarden; de rest hoort niet in de kolom.
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.answers ?? {})) {
    if (VALID_KEYS.has(key) && typeof value === 'string') {
      answers[key] = value.slice(0, 5000);
    }
  }

  // De statuscheck zit in de update zelf: een oude tab kan een verzonden
  // intake zo niet meer overschrijven.
  const { data, error } = await supabaseAdmin
    .from('intakes')
    .update({ answers, current_step: step, status: 'in_progress' })
    .eq('token', body.token)
    .in('status', EDITABLE)
    .select('id, started_at')
    .maybeSingle();

  if (error) return Response.json({ error: 'Opslaan lukte niet.' }, { status: 500 });
  if (!data) return Response.json({ error: 'Deze intake is al verzonden.' }, { status: 409 });

  if (!data.started_at) {
    await supabaseAdmin
      .from('intakes')
      .update({ started_at: new Date().toISOString() })
      .eq('id', data.id);
  }

  return Response.json({ ok: true });
}
