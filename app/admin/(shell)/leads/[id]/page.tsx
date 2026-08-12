import { notFound } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { PixelIcon, type IconName } from '@/components/icons';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LEAD_STATUS_LABEL, LEAD_STATUS_DOT, LOST_REASONS, DUE_LABEL } from '@/lib/copy';
import { LEAD_STATUSES, leadDue, parseLeadStatus, responseMinutes } from '@/lib/lead-status';
import { formatDate } from '@/lib/dates';
import { saveLeadFollowUp, updateLead, deleteLead } from '../../../lead-actions';
import Notes, { type Note } from '@/components/notes';

export const dynamic = 'force-dynamic';

const field =
  'min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm outline-none focus:border-ink';
const primary = 'min-h-10 rounded-ww bg-ink px-4 text-sm font-semibold text-white';
const secondary = 'min-h-10 rounded-ww border border-line px-4 text-sm font-semibold';

export default async function LeadPage({ params }: PageProps<'/admin/leads/[id]'>) {
  const { id } = await params;

  const { data: lead } = await supabaseAdmin.from('leads').select('*').eq('id', id).maybeSingle();
  if (!lead) notFound();

  const status = parseLeadStatus(lead.status);
  const today = new Date().toISOString().slice(0, 10);
  const due = leadDue({ status: lead.status, nextActionAt: lead.next_action_at }, today);
  const minuten = responseMinutes(lead.received_at, lead.first_attempt_at);

  const { data: notes } = await supabaseAdmin
    .from('notes')
    .select('id, body, author, created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .returns<Note[]>();

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
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid content-start gap-5">
            <Kaart title="Na het belletje" icon="clock">
              <form action={saveLeadFollowUp.bind(null, id)} className="grid gap-4">
                <label className="flex items-center gap-2.5 rounded-ww bg-bg px-3 py-2.5 text-sm font-semibold">
                  <input type="checkbox" name="poging" value="ja" className="size-4" />
                  Ik heb zojuist gebeld
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">Wat is het geworden</span>
                  <select name="status" defaultValue={lead.status} className={field}>
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">Volgende actie op</span>
                  <input
                    type="date"
                    name="next_action_at"
                    defaultValue={lead.next_action_at ?? ''}
                    className={field}
                  />
                  <span className="text-xs text-muted">
                    Bij &quot;niet bereikt&quot; is dit wanneer je opnieuw belt, bij
                    &quot;afspraak&quot; is het de afspraak zelf. Leeglaten mag, maar dan valt hij
                    onder &quot;geen vervolgactie&quot;.
                  </span>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">Reden, als je hem verliest</span>
                  <select name="lost_reason" defaultValue={lead.lost_reason ?? ''} className={field}>
                    <option value="">Geen</option>
                    {Object.entries(LOST_REASONS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted">
                    Wordt alleen bewaard als de status &quot;verloren&quot; is.
                  </span>
                </label>

                <button className={primary}>Opslaan</button>
              </form>
            </Kaart>

            <Kaart title="Notities" icon="note">
              <Notes target="lead" id={id} notes={notes ?? []} />
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
