import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isEditable } from '@/lib/intake-status';
import { listIntakeFiles, supabaseFileStore } from '@/lib/intake-files';
import { TOTAL_STEPS } from '@/lib/questions';
import IntakeForm from './form';
import type { ExistingFile } from './upload';

const THUMBNAIL_TTL = 3600;

export default async function IntakePage({ params }: PageProps<'/i/[token]'>) {
  const { token } = await params;

  const { data } = await supabaseAdmin
    .from('intakes')
    .select('id, company_name, answers, current_step, status')
    .eq('token', token)
    .maybeSingle();

  if (!data) notFound();
  // Al verzonden: het formulier zou toch elke wijziging weigeren.
  if (!isEditable(data.status)) redirect(`/i/${token}/klaar`);

  const files = await listIntakeFiles(
    supabaseFileStore(supabaseAdmin),
    data.id,
    THUMBNAIL_TTL
  );

  const byKind: Record<string, ExistingFile[]> = { logo: [], photo: [] };
  for (const file of files) {
    if (file.url) (byKind[file.kind] ??= []).push({ id: file.id, name: file.name, url: file.url });
  }

  return (
    <IntakeForm
      token={token}
      companyName={data.company_name}
      initialAnswers={data.answers ?? {}}
      initialStep={Math.min(Math.max(data.current_step ?? 1, 1), TOTAL_STEPS)}
      files={byKind}
      whatsapp={process.env.WHATSAPP_NUMBER || undefined}
    />
  );
}
