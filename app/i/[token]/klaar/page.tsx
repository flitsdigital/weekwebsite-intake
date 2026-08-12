import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isEditable } from '@/lib/intake-status';
import { formatLongDate } from '@/lib/dates';

export default async function KlaarPage({ params }: PageProps<'/i/[token]/klaar'>) {
  const { token } = await params;

  const { data } = await supabaseAdmin
    .from('intakes')
    .select('status, deadline_at')
    .eq('token', token)
    .maybeSingle();

  if (!data) notFound();
  if (isEditable(data.status)) redirect(`/i/${token}`);

  const deadline = formatLongDate(data.deadline_at);

  return (
    <main className="m-auto w-full max-w-xl px-5 py-16">
      <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-accent text-2xl">
        ✓
      </div>
      <h1 className="text-3xl font-bold leading-tight">Dank je, we hebben alles binnen.</h1>

      {deadline && (
        <p className="mt-4 text-lg">
          Je website staat online op <strong>{deadline}</strong>.
        </p>
      )}

      <p className="mt-4 text-muted">
        We gaan aan de slag. Hebben we nog iets van je nodig, dan bellen we je. Je hoeft
        verder niets te doen.
      </p>
    </main>
  );
}
