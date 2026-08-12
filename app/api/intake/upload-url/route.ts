import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { openIntake } from '@/lib/intake';
import { ALLOWED_TYPES, BUCKET } from '@/lib/storage';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const intake = await openIntake(body?.token);
  if (!intake) return Response.json({ error: 'Deze link werkt niet meer.' }, { status: 404 });

  const ext = ALLOWED_TYPES[body.contentType];
  if (!ext) {
    return Response.json(
      { error: 'Dit bestandstype kunnen we niet gebruiken. Stuur een foto of pdf.' },
      { status: 400 }
    );
  }

  const kind = body.kind === 'logo' ? 'logo' : 'photo';
  const path = `${intake.id}/${kind === 'logo' ? 'logo' : 'photos'}/${randomUUID()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return Response.json({ error: 'Uploaden lukt nu even niet.' }, { status: 500 });
  }

  return Response.json({ uploadUrl: data.signedUrl, path });
}
