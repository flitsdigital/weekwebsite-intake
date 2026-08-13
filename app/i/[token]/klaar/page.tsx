import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isEditable } from '@/lib/intake-status';
import { formatLongDate } from '@/lib/dates';
import { STEPS, isVisible } from '@/lib/questions';

export default async function KlaarPage({ params }: PageProps<'/i/[token]/klaar'>) {
  const { token } = await params;

  const { data } = await supabaseAdmin
    .from('intakes')
    .select('id, status, deadline_at, answers')
    .eq('token', token)
    .maybeSingle();

  if (!data) notFound();
  if (isEditable(data.status)) redirect(`/i/${token}`);

  const deadline = formatLongDate(data.deadline_at);
  const answers = (data.answers ?? {}) as Record<string, string>;

  const { count: bestanden } = await supabaseAdmin
    .from('intake_files')
    .select('*', { count: 'exact', head: true })
    .eq('intake_id', data.id);

  const whatsapp = process.env.WHATSAPP_NUMBER;

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
        We gaan aan de slag. Hebben we nog iets van je nodig, dan bellen we je. Je hoeft verder
        niets te doen.
      </p>

      {/* Geruststelling achteraf: je kunt nakijken wat je hebt doorgegeven. */}
      <details className="mt-8 rounded-ww border border-line bg-white">
        <summary className="cursor-pointer px-5 py-4 font-semibold marker:text-muted">
          Bekijk wat je hebt ingevuld
        </summary>

        <div className="border-t border-line px-5 py-4">
          {STEPS.map((step) => {
            const filled = step.questions.filter(
              (q) =>
                q.type !== 'upload' &&
                q.type !== 'info' &&
                isVisible(q, answers) &&
                answers[q.key]?.trim()
            );
            if (!filled.length) return null;

            return (
              <div key={step.id} className="mb-5 last:mb-0">
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                  {step.title}
                </p>
                <dl className="grid gap-3">
                  {filled.map((q) => (
                    <div key={q.key} className="border-l-2 border-line pl-3">
                      <dt className="text-sm text-muted">{q.label}</dt>
                      <dd className="whitespace-pre-line">{answers[q.key]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}

          <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
            {bestanden
              ? `Je stuurde ${bestanden} ${bestanden === 1 ? 'bestand' : 'bestanden'} mee.`
              : 'Je stuurde geen foto’s mee — dat mag, we nemen contact op als we ze nodig hebben.'}
          </p>
        </div>
      </details>

      <p className="mt-6 text-sm text-muted">
        Klopt er iets niet?{' '}
        {whatsapp ? (
          <>
            App of bel ons op{' '}
            <a className="underline" href={`tel:${whatsapp.replace(/\s/g, '')}`}>
              {whatsapp}
            </a>
            , dan passen wij het aan.
          </>
        ) : (
          'Bel ons even, dan passen wij het aan.'
        )}
      </p>
    </main>
  );
}
