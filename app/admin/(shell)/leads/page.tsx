import Link from 'next/link';
import PageHeader from '@/components/page-header';
import { PixelIcon } from '@/components/icons';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LEAD_STATUS_LABEL, LEAD_STATUS_DOT, DUE_LABEL } from '@/lib/copy';
import { DUE_ORDER, leadDue, parseLeadStatus, responseMinutes, type Due } from '@/lib/lead-status';
import { formatDate } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const control = 'min-h-10 rounded-ww border border-line bg-white px-3 text-sm';

/** Vandaag toont alles waar je iets mee moet; "later" en afgesloten niet. */
const AAN_DE_BEURT: Due[] = ['nieuw', 'te_laat', 'vandaag', 'geen_vervolg'];

const URGENT: Due[] = ['nieuw', 'te_laat'];

type Row = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  status: string;
  next_action_at: string | null;
  received_at: string;
  first_attempt_at: string | null;
};

export default async function LeadsPage({ searchParams }: PageProps<'/admin/leads'>) {
  const { weergave } = await searchParams;
  const vandaag = weergave !== 'alles';
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabaseAdmin
    .from('leads')
    .select('id, company_name, contact_name, phone, status, next_action_at, received_at, first_attempt_at')
    .order('received_at', { ascending: false });

  const alle = ((data ?? []) as Row[]).map((row) => ({
    row,
    due: leadDue({ status: row.status, nextActionAt: row.next_action_at }, today),
  }));

  const zichtbaar = (vandaag ? alle.filter((l) => AAN_DE_BEURT.includes(l.due)) : alle).sort(
    (a, b) => DUE_ORDER.indexOf(a.due) - DUE_ORDER.indexOf(b.due)
  );

  const teDoen = alle.filter((l) => AAN_DE_BEURT.includes(l.due)).length;

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={
          teDoen ? `${teDoen} ${teDoen === 1 ? 'lead' : 'leads'} aan de beurt` : 'Niemand aan de beurt'
        }
        action={
          <Link
            href="/admin/leads/nieuw"
            className="flex min-h-10 items-center gap-2 rounded-ww bg-ink px-4 text-sm font-semibold text-white"
          >
            <PixelIcon name="plus" />
            Lead toevoegen
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        <nav className="flex gap-2 text-sm">
          <Tab active={vandaag} href="/admin/leads">
            Vandaag
          </Tab>
          <Tab active={!vandaag} href="/admin/leads?weergave=alles">
            Alles ({alle.length})
          </Tab>
        </nav>

        {zichtbaar.length === 0 ? (
          <div className="mt-6 rounded-ww border border-dashed border-line bg-white px-6 py-14 text-center">
            <p className="font-semibold">{vandaag ? 'Niemand aan de beurt' : 'Nog geen leads'}</p>
            <p className="mt-1 text-sm text-muted">
              {vandaag
                ? 'Alles is gebeld en ingepland. Kijk bij "Alles" voor de rest.'
                : 'Leads komen binnen via Zapier, of voeg er zelf een toe.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-ww border border-line bg-white">
            <table className="w-full min-w-2xl text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
                  <th className="px-5 py-3 font-semibold">Bedrijf</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Aan de beurt</th>
                  <th className="px-3 py-3 font-semibold">Reactietijd</th>
                  <th className="px-5 py-3 text-right font-semibold">Bellen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {zichtbaar.map(({ row, due }) => {
                  const status = parseLeadStatus(row.status);
                  const minuten = responseMinutes(row.received_at, row.first_attempt_at);

                  return (
                    <tr key={row.id} className="hover:bg-bg">
                      <td className="px-5 py-3">
                        <Link href={`/admin/leads/${row.id}`} className="block">
                          <span className="font-semibold">
                            {row.company_name ?? row.contact_name ?? 'Naamloze lead'}
                          </span>
                          {row.company_name && row.contact_name && (
                            <span className="block text-xs text-muted">{row.contact_name}</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {status && (
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            <span
                              className={`size-2 shrink-0 rounded-full ${LEAD_STATUS_DOT[status]}`}
                            />
                            {LEAD_STATUS_LABEL[status]}
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-3 py-3 whitespace-nowrap ${URGENT.includes(due) ? 'font-semibold text-red-700' : 'text-muted'}`}
                      >
                        {DUE_LABEL[due]}
                        {due === 'later' && row.next_action_at && (
                          <span className="block text-xs">{formatDate(row.next_action_at)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted">
                        {minuten === null ? (
                          '—'
                        ) : (
                          <span className={minuten <= 5 ? 'text-green-700' : undefined}>
                            {minuten < 60 ? `${minuten} min` : `${Math.round(minuten / 60)} uur`}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {row.phone ? (
                          <a
                            href={`tel:${row.phone.replace(/\s/g, '')}`}
                            className="rounded-ww border border-line px-3 py-1.5 font-semibold whitespace-nowrap hover:border-ink"
                          >
                            {row.phone}
                          </a>
                        ) : (
                          <span className="text-muted">geen nummer</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Tab({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${control} flex items-center font-semibold ${active ? 'border-ink bg-ink text-white' : 'text-muted'}`}
    >
      {children}
    </Link>
  );
}
