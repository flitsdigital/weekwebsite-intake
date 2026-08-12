import { supabaseAdmin } from '@/lib/supabase-admin';
import { openIntake } from '@/lib/intake';
import { BUCKET } from '@/lib/storage';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const intake = await openIntake(body?.token);
  if (!intake) return Response.json({ error: 'Deze link werkt niet meer.' }, { status: 404 });

  // Zonder deze check zou je een pad van een andere intake kunnen vastleggen.
  if (typeof body.path !== 'string' || !body.path.startsWith(`${intake.id}/`)) {
    return Response.json({ error: 'Ongeldig bestand.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('intake_files')
    .insert({
      intake_id: intake.id,
      kind: body.kind === 'logo' ? 'logo' : 'photo',
      storage_path: body.path,
      original_name: typeof body.originalName === 'string' ? body.originalName.slice(0, 200) : null,
      bytes: Number.isInteger(body.bytes) ? body.bytes : null,
    })
    .select('id')
    .single();

  if (error) return Response.json({ error: 'Vastleggen lukte niet.' }, { status: 500 });

  await touchCustomerActivity(intake.id);
  return Response.json({ id: data.id });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  const intake = await openIntake(body?.token);
  if (!intake) return Response.json({ error: 'Deze link werkt niet meer.' }, { status: 404 });

  const { data: file } = await supabaseAdmin
    .from('intake_files')
    .select('id, storage_path')
    .eq('id', body?.fileId)
    .eq('intake_id', intake.id)
    .maybeSingle();

  if (!file) return Response.json({ error: 'Bestand niet gevonden.' }, { status: 404 });

  await supabaseAdmin.storage.from(BUCKET).remove([file.storage_path]);
  await supabaseAdmin.from('intake_files').delete().eq('id', file.id);
  await touchCustomerActivity(intake.id);

  return Response.json({ ok: true });
}

/** Uploaden en verwijderen zijn net zo goed activiteit van de klant als typen. */
async function touchCustomerActivity(intakeId: string) {
  await supabaseAdmin
    .from('intakes')
    .update({ last_customer_activity_at: new Date().toISOString() })
    .eq('id', intakeId);
}
