import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { PixelIcon, type IconName } from '@/components/icons';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { listIntakeFiles, supabaseFileStore } from '@/lib/intake-files';
import { STEPS, TOTAL_STEPS, isVisible } from '@/lib/questions';
import { progressPercent } from '@/lib/progress';
import { STATUS_LABEL, STALL_REASONS } from '@/lib/copy';
import { formatDate } from '@/lib/dates';
import { sourceLabel } from '@/lib/lead-source';
import { intakeSignal, signalText } from '@/lib/intake-signal';
import { STATUSES, parseStatus } from '@/lib/intake-status';
import StatusDot from '@/components/status-dot';
import {
  updateIntake,
  updateStatus,
  regenerateToken,
  deleteIntake,
  saveStallReason,
  markReminded,
} from '../../../actions';
import CopyLink from './copy-link';
import Timeline, { type Note } from '@/components/timeline';
import { addNote, deleteNote } from '../../../note-actions';

const field = 'min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm';
const primary = 'min-h-10 rounded-ww bg-ink px-4 text-sm font-semibold text-white';
const secondary = 'min-h-10 rounded-ww border border-line px-4 text-sm font-semibold';
const THUMBNAIL_TTL = 3600;

export default async function KlantPage({ params, searchParams }: PageProps<'/admin/klanten/[id]'>) {
  const { id } = await params;
  const { nieuw } = await searchParams;

  const { data: intake } = await supabaseAdmin
    .from('intakes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!intake) notFound();
  const status = parseStatus(intake.status);

  const files = await listIntakeFiles(supabaseFileStore(supabaseAdmin), id, THUMBNAIL_TTL);

  const { data: lead } = intake.lead_id
    ? await supabaseAdmin
        .from('leads')
        .select('id, source, received_at')
        .eq('id', intake.lead_id)
        .maybeSingle()
    : { data: null };

  const { data: notes } = await supabaseAdmin
    .from('notes')
    .select('id, body, author, created_at, channel, outcome')
    .eq('intake_id', id)
    .order('created_at', { ascending: false })
    .returns<Note[]>();
  const answers = (intake.answers ?? {}) as Record<string, string>;
  const signal = intakeSignal({
    status: intake.status,
    openedAt: intake.opened_at,
    startedAt: intake.started_at,
    lastCustomerActivityAt: intake.last_customer_activity_at,
    currentStep: intake.current_step,
  });
  const melding = signalText(signal);
  const percent = progressPercent(answers);
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/i/${intake.token}`;

  return (
    <>
      <PageHeader
        title={intake.company_name}
        crumb={{ href: '/admin/klanten', label: 'Klanten' }}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {status && <StatusDot status={status} label />}
            <span>{percent}% ingevuld</span>
            <span>
              stap {intake.current_step}/{TOTAL_STEPS}
              {intake.max_step_reached > intake.current_step &&
                ` (kwam tot ${intake.max_step_reached})`}
            </span>
            {melding ? <span className="text-red-700">{melding}</span> : <span>Actief</span>}
            {intake.deadline_at && <span>oplevering {formatDate(intake.deadline_at)}</span>}
          </span>
        }
        action={
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2 ${secondary}`}
          >
            <PixelIcon name="external" />
            Bekijk als klant
          </a>
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        {nieuw && (
          <p className="mb-6 flex items-center gap-2 rounded-ww bg-accent px-4 py-3 text-sm font-semibold">
            <PixelIcon name="check" />
            Aangemaakt. Stuur deze link naar de klant.
          </p>
        )}

        {lead && (
          <Link
            href={`/admin/leads/${lead.id}`}
            className="mb-5 flex items-center gap-2 rounded-ww border border-line bg-white px-4 py-3 text-sm hover:border-ink"
          >
            <PixelIcon name="zap" className="size-4 text-muted" />
            <span>
              Kwam binnen als lead via <strong>{sourceLabel(lead.source)}</strong> op{' '}
              {formatDate(lead.received_at)}
            </span>
            <PixelIcon name="chevron" className="ml-auto size-4 text-muted" />
          </Link>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <div className="grid content-start gap-5">
            <Card title="Intakelink" icon="link">
              <CopyLink url={link} />
              <form action={regenerateToken.bind(null, id)} className="mt-3">
                <button className="text-xs text-muted underline hover:text-ink">
                  Nieuwe link maken — de oude werkt dan niet meer
                </button>
              </form>
            </Card>

            <Card title="Antwoorden" icon="note">
              {Object.keys(answers).length === 0 ? (
                <p className="text-sm text-muted">De klant is nog niet begonnen.</p>
              ) : (
                <div className="grid gap-6">
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
                      <div key={step.id}>
                        <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">
                          {step.title}
                        </p>
                        <dl className="grid gap-3">
                          {filled.map((q) => (
                            <div key={q.key} className="border-l-2 border-line pl-3">
                              <dt className="text-xs text-muted">{q.label}</dt>
                              <dd className="whitespace-pre-line">{answers[q.key]}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title={`Beeldmateriaal (${files.length})`} icon="image">
              {files.length === 0 ? (
                <p className="text-sm text-muted">Nog niets geüpload.</p>
              ) : (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {files.map((file) =>
                    file.url ? (
                      <li key={file.id} className="relative">
                        {/* Klikken opent het bestand op ware grootte — geen lightbox nodig. */}
                        <a href={file.url} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.url}
                            alt={file.name}
                            className="aspect-square w-full rounded-ww border border-line object-cover"
                          />
                          {file.kind === 'logo' && (
                            <span className="absolute top-1.5 left-1.5 rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              Logo
                            </span>
                          )}
                        </a>
                        <a
                          href={file.url}
                          download={file.name}
                          className="mt-1 flex items-center gap-1 text-xs text-muted hover:text-ink"
                        >
                          <PixelIcon name="download" className="size-3.5" />
                          Download
                        </a>
                      </li>
                    ) : (
                      // Rij zonder bestand in Storage: laat zien dát het mist in plaats van een kapotte afbeelding.
                      <li key={file.id}>
                        <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-ww border border-dashed border-line p-2 text-center">
                          <PixelIcon name="image" className="size-5 text-muted" />
                          <span className="text-[11px] break-all text-muted">
                            {file.name}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-red-700">Bestand ontbreekt</p>
                      </li>
                    )
                  )}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid content-start gap-5">
            <Card title="Status" icon="zap">
              <form action={updateStatus.bind(null, id)} className="grid gap-2">
                <select name="status" defaultValue={intake.status} className={field}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button className={primary}>Status opslaan</button>
              </form>
            </Card>

            <Card title="Gegevens" icon="user">
              <form action={updateIntake.bind(null, id)} className="grid gap-2">
                <input name="company_name" defaultValue={intake.company_name} className={field} />
                <input
                  name="contact_name"
                  defaultValue={intake.contact_name ?? ''}
                  placeholder="Contactpersoon"
                  className={field}
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={intake.email ?? ''}
                  placeholder="E-mailadres"
                  className={field}
                />
                <input
                  name="phone"
                  type="tel"
                  defaultValue={intake.phone ?? ''}
                  placeholder="Telefoonnummer"
                  className={field}
                />
                <button className={secondary}>Gegevens opslaan</button>
              </form>
            </Card>

            <Card title="Opvolging" icon="clock">
              <p className="text-sm">
                {melding ? (
                  <span className="font-semibold text-red-700">{melding}</span>
                ) : (
                  <span className="text-muted">Geen signaal — de klant is recent bezig geweest.</span>
                )}
              </p>

              <form action={saveStallReason.bind(null, id)} className="mt-3 grid gap-2">
                <label className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Reden van vertraging
                </label>
                <select name="stall_reason" defaultValue={intake.stall_reason ?? ''} className={field}>
                  <option value="">Nog niet gevraagd</option>
                  {Object.entries(STALL_REASONS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button className={secondary}>Reden opslaan</button>
              </form>

              <form action={markReminded.bind(null, id)} className="mt-3 border-t border-line pt-3">
                <p className="mb-2 text-xs text-muted">
                  {intake.last_reminder_at
                    ? `Laatst herinnerd op ${formatDate(intake.last_reminder_at)}`
                    : 'Nog niet herinnerd'}
                </p>
                <button className={secondary}>Herinnering verstuurd</button>
              </form>
            </Card>

            <Card title="Contact en notities" icon="note">
              <Timeline
                save={addNote.bind(null, 'intake', id)}
                remove={deleteNote.bind(null, 'intake', id)}
                notes={notes ?? []}
              />
            </Card>

            <form action={deleteIntake.bind(null, id)}>
              <button className="flex items-center gap-1.5 text-xs text-red-700 hover:underline">
                <PixelIcon name="trash" className="size-3.5" />
                Klant verwijderen, inclusief bestanden
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-ww border border-line bg-white">
      <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-semibold">
        <PixelIcon name={icon} className="size-4 text-muted" />
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}
