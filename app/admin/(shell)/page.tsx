import Link from 'next/link';
import PageHeader from '@/components/page-header';
import { PixelIcon } from '@/components/icons';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { progressPercent } from '@/lib/progress';
import { STATUS_LABEL } from '@/lib/copy';
import { daysSince, daysUntil, formatDate } from '@/lib/dates';
import { isActive, isWaiting, needsAttention, parseStatus } from '@/lib/intake-status';

// Zonder dit bakt Next de tellingen in de build en verandert het dashboard nooit meer.
export const dynamic = 'force-dynamic';

const DEADLINE_SOON_DAYS = 2;

type Row = {
  id: string;
  company_name: string;
  status: string;
  updated_at: string;
  deadline_at: string | null;
  answers: Record<string, string> | null;
};

export default async function DashboardPage() {
  const { data } = await supabaseAdmin
    .from('intakes')
    .select('id, company_name, status, updated_at, deadline_at, answers')
    .neq('status', 'cancelled')
    .order('updated_at', { ascending: false });

  const all = (data ?? []) as Row[];
  const waiting = all.filter((r) => isWaiting(r.status));
  const building = all.filter((r) => isActive(r.status));

  const soon = all
    .filter((r) => {
      if (r.status === 'live') return false;
      const days = daysUntil(r.deadline_at);
      return days !== null && days <= DEADLINE_SOON_DAYS;
    })
    .sort((a, b) => (a.deadline_at! < b.deadline_at! ? -1 : 1));

  const attention = all.filter((r) => needsAttention(r.status, daysSince(r.updated_at) ?? 0));

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`${all.length} lopende opdrachten`} />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            value={waiting.length}
            label="Wacht op materiaal"
            dot="bg-accent"
            hint={
              attention.length
                ? `${attention.length} langer dan 2 dagen stil`
                : 'Allemaal recent actief'
            }
          />
          <Stat
            value={building.length}
            label="In aanbouw"
            dot="bg-btn"
            hint={building.length ? 'Bouw en preview' : 'Niets onderhanden'}
          />
          <Stat
            value={soon.length}
            label="Deadline binnen 2 dagen"
            dot={soon.length ? 'bg-red-600' : 'bg-line'}
            hint={soon.length ? `Eerstvolgende ${formatDate(soon[0].deadline_at)}` : 'Geen druk'}
          />
        </div>

        <Panel
          title="Vraagt om aandacht"
          icon="clock"
          rows={attention}
          empty="Niemand wacht te lang. Mooi."
          right={(row) => `${daysSince(row.updated_at)} dagen stil`}
          urgent
        />

        <Panel
          title="Deadlines die eraan komen"
          icon="zap"
          rows={soon}
          empty="Geen deadline binnen twee dagen."
          right={(row) => formatDate(row.deadline_at) ?? ''}
        />
      </div>
    </>
  );
}

function Stat({
  value,
  label,
  dot,
  hint,
}: {
  value: number;
  label: string;
  dot: string;
  hint: string;
}) {
  return (
    <div className="rounded-ww border border-line bg-white p-5">
      <p className="text-4xl font-bold tabular-nums">{value}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
        <span className={`size-2 rounded-full ${dot}`} />
        {label}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  rows,
  empty,
  right,
  urgent,
}: {
  title: string;
  icon: 'clock' | 'zap';
  rows: Row[];
  empty: string;
  right: (row: Row) => string;
  urgent?: boolean;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-ww border border-line bg-white">
      <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-semibold">
        <PixelIcon name={icon} className="size-4 text-muted" />
        {title}
      </h2>

      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.slice(0, 6).map((row) => {
            const status = parseStatus(row.status);
            return (
              <li key={row.id}>
                <Link
                  href={`/admin/klanten/${row.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-bg"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{row.company_name}</span>
                  <span className="hidden text-xs text-muted sm:block">
                    {status && STATUS_LABEL[status]} · {progressPercent(row.answers)}%
                  </span>
                  <span
                    className={`w-32 text-right text-sm tabular-nums ${urgent ? 'text-red-700' : 'text-muted'}`}
                  >
                    {right(row)}
                  </span>
                  <PixelIcon name="chevron" className="size-4 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
