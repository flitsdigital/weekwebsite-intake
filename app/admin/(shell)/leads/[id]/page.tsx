import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { PixelIcon, type IconName } from '@/components/icons';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LEAD_STATUS_LABEL, LEAD_STATUS_DOT, DUE_LABEL } from '@/lib/copy';
import { leadDue, parseLeadStatus, responseMinutes } from '@/lib/lead-status';
import { formatDate } from '@/lib/dates';
import { sourceLabel } from '@/lib/lead-source';
import { saveLeadContact, updateLead, deleteLead, convertLeadToIntake } from '../../../lead-actions';
import { deleteNote } from '../../../note-actions';
import Timeline, { type Note } from '@/components/timeline';
import FollowUpFields from './followup-fields';

export const dynamic = 'force-dynamic';

const field =
  'min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm outline-none focus:border-ink';
const primary = 'min-h-10 rounded-ww bg-ink px-4 text-sm font-semibold text-white';
const secondary = 'min-h-10 rounded-ww border border-line px-4 text-sm font-semibold';

export default async function LeadPage({ params }: PageProps<'/admin/leads/[id]'>) {
  const { id } = await params;

  const { data: lead } = await supabaseAdmin.from('leads').select('*').eq('id', id).maybeSingle();
  if (!lead) notFound();

  const { data: notes } = await supabaseAdmin
    .from('notes')
    .select('id, body, author, created_at, channel, outcome')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .returns<Note[]>();

  // De koppeling staat op de intake; de teruglink leiden we daaruit af.
  const { data: klant } = await supabaseAdmin
    .from('intakes')
    .select('id, company_name')
    .eq('lead_id', id)
    .maybeSingle();

  const status = parseLeadStatus(lead.status);
  const today = new Date().toISOString().slice(0, 10);
  const due = leadDue(
    {
      status: lead.status,
      nextActionAt: lead.next_action_at,
      contactCount: (notes ?? []).filter((n) => n.channel).length,
    },
    today
  );
  const minuten = responseMinutes(lead.received_at, lead.first_attempt_at);

  const titel = lead.company_name ?? lead.contact_name ?? 'Naamloze lead';

  return (
    <>
      <PageHeader
        title={titel}
        crumb={{ href: '/admin/leads', label: 'Leads' }}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {status && (
              <span className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${LEAD_STATUS_DOT[status]}`} />
                {LEAD_STATUS_LABEL[status]}
              </span>
            )}
            <span>{DUE_LABEL[due]}</span>
            <span>via {sourceLabel(lead.source)}</span>
            <span>binnengekomen {formatDate(lead.received_at)}</span>
            {minuten !== null && (
              <span className={minuten <= 5 ? 'text-green-700' : undefined}>
                gebeld na {minuten < 60 ? `${minuten} min` : `${Math.round(minuten / 60)} uur`}
              </span>
            )}
          </span>
        }
        action={
          lead.phone ? (
            <a
              href={`tel:${lead.phone.replace(/\s/g, '')}`}
              className={`flex items-center gap-2 ${primary}`}
            >
              <PixelIcon name="user" />
              Bel {lead.phone}
            </a>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        {klant ? (
          <Link
            href={`/admin/klanten/${klant.id}`}
            className="mb-5 flex items-center gap-2 rounded-ww border border-line bg-white px-4 py-3 text-sm hover:border-ink"
          >
            <PixelIcon name="users" className="size-4 text-muted" />
            <span>
              Deze lead is klant geworden — <strong>{klant.company_name}</strong>
            </span>
            <PixelIcon name="chevron" className="ml-auto size-4 text-muted" />
          </Link>
        ) : (
          lead.status === 'gewonnen' && (
            <form action={convertLeadToIntake.bind(null, id)} className="mb-5">
              <div className="rounded-ww bg-accent px-5 py-4">
                <p className="font-semibold">Gewonnen — maak er een klant van</p>
                <p className="mt-1 mb-3 text-sm">
                  Naam, telefoon, e-mail en de hele gesprekshistorie gaan mee. Je krijgt meteen
                  de intakelink om te versturen. De lead blijft bestaan voor je cijfers.
                </p>
                <button className="min-h-10 rounded-ww bg-ink px-4 text-sm font-semibold text-white">
                  Omzetten naar klant en openen
                </button>
              </div>
            </form>
          )
        )}

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid content-start gap-5">
            <Kaart title="Contact en opvolging" icon="clock">
              <Timeline
                save={saveLeadContact.bind(null, id)}
                remove={deleteNote.bind(null, 'lead', id)}
                notes={notes ?? []}
                extra={
                  <FollowUpFields
                    status={lead.status}
                    nextActionAt={lead.next_action_at}
                    lostReason={lead.lost_reason}
                  />
                }
              />
            </Kaart>

            {Object.keys(lead.raw ?? {}).length > 0 && (
              <Kaart title="Zoals het binnenkwam" icon="note">
                {/* Alles wat het formulier stuurde, ook velden die we niet omzetten. */}
                <details>
                  <summary className="cursor-pointer text-sm text-muted">
                    Oorspronkelijke gegevens tonen
                  </summary>
                  <dl className="mt-3 grid gap-2 text-sm">
                    {Object.entries(lead.raw as Record<string, unknown>).map(([key, value]) => (
                      <div key={key} className="border-l-2 border-line pl-3">
                        <dt className="text-xs text-muted">{key}</dt>
                        <dd className="break-words">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </Kaart>
            )}
          </div>

          <div className="grid content-start gap-5">
            <Kaart title="Gegevens" icon="user">
              <form action={updateLead.bind(null, id)} className="grid gap-2">
                <input
                  name="company_name"
                  defaultValue={lead.company_name ?? ''}
                  placeholder="Bedrijfsnaam"
                  className={field}
                />
                <input
                  name="contact_name"
                  defaultValue={lead.contact_name ?? ''}
                  placeholder="Contactpersoon"
                  className={field}
                />
                <input
                  name="phone"
                  type="tel"
                  defaultValue={lead.phone ?? ''}
                  placeholder="Telefoonnummer"
                  className={field}
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={lead.email ?? ''}
                  placeholder="E-mailadres"
                  className={field}
                />
                <button className={secondary}>Gegevens opslaan</button>
              </form>
            </Kaart>

            <form action={deleteLead.bind(null, id)}>
              <button className="flex items-center gap-1.5 text-xs text-red-700 hover:underline">
                <PixelIcon name="trash" className="size-3.5" />
                Lead verwijderen
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

function Kaart({
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
