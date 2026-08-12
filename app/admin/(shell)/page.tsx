import Link from 'next/link';
import PageHeader from '@/components/page-header';
import { PixelIcon } from '@/components/icons';
import Funnel from '@/components/funnel';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { STATUS_LABEL } from '@/lib/copy';
import { daysUntil, formatDate } from '@/lib/dates';
import { isActive, isWaiting, parseStatus } from '@/lib/intake-status';
import { intakeSignal, signalText } from '@/lib/intake-signal';

// Zonder dit bakt Next de tellingen in de build en verandert het dashboard nooit meer.
export const dynamic = 'force-dynamic';

const DEADLINE_SOON_DAYS = 2;

type Row = {
  id: string;
  company_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  deadline_at: string | null;
  opened_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  last_customer_activity_at: string | null;
  current_step: number;
  max_step_reached: number;
};

function withinDays(rows: Row[], days: number | null) {
  if (!days) return rows;
  const cutoff = Date.now() - days * 86_400_000;
  return rows.filter((row) => new Date(row.created_at).getTime() >= cutoff);
}

export default async function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  const { periode } = await searchParams;
  const days = periode === '90' ? 90 : null;

  const { data } = await supabaseAdmin
    .from('intakes')
    .select(
      'id, company_name, status, created_at, updated_at, deadline_at, opened_at, started_at, submitted_at, last_customer_activity_at, current_step, max_step_reached'
    )
    .order('updated_at', { ascending: false });

  const all = (data ?? []) as Row[];

  // De trechter telt cancelled mee; de dagelijkse blokken niet.
  const funnelRows = withinDays(all, days);

  const lopend = all.filter((r) => r.status !== 'cancelled');
  const waiting = lopend.filter((r) => isWaiting(r.status));
  const building = lopend.filter((r) => isActive(r.status));

  const soon = lopend
    .filter((r) => {
      if (r.status === 'live') return false;
      const left = daysUntil(r.deadline_at);
      return left !== null && left <= DEADLINE_SOON_DAYS;
    })
    .sort((a, b) => (a.deadline_at! < b.deadline_at! ? -1 : 1));

  const signals = waiting
    .map((row) => ({ row, signal: intakeSignal({ ...row, openedAt: row.opened_at, startedAt: row.started_at, lastCustomerActivityAt: row.last_customer_activity_at, currentStep: row.current_step }) }))
    .filter(({ signal }) => signal.kind !== 'actief' && signal.kind !== 'niet_van_toepassing');

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`${lopend.length} lopende opdrachten`} />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            value={waiting.length}
            label="Wacht op materiaal"
            dot="bg-accent"
            hint={signals.length ? `${signals.length} vraagt om actie` : 'Allemaal recent actief'}
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

        <section className="mt-6 overflow-hidden rounded-ww border border-line bg-white">
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-semibold">
            <PixelIcon name="clock" className="size-4 text-muted" />
            Vraagt om aandacht
          </h2>

          {signals.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Niemand hangt vast. Mooi.</p>
          ) : (
            <ul className="divide-y divide-line">
              {signals.slice(0, 8).map(({ row, signal }) => (
                <li key={row.id}>
                  <Link
                    href={`/admin/klanten/${row.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-bg"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{row.company_name}</span>
                    <span className="text-right text-sm text-red-700">{signalText(signal)}</span>
                    <PixelIcon name="chevron" className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-ww border border-line bg-white">
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-semibold">
            <PixelIcon name="zap" className="size-4 text-muted" />
            Deadlines die eraan komen
          </h2>
          {soon.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Geen deadline binnen twee dagen.</p>
          ) : (
            <ul className="divide-y divide-line">
              {soon.slice(0, 6).map((row) => {
                const status = parseStatus(row.status);
                return (
                  <li key={row.id}>
                    <Link
                      href={`/admin/klanten/${row.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-bg"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {row.company_name}
                      </span>
                      <span className="hidden text-xs text-muted sm:block">
                        {status && STATUS_LABEL[status]}
                      </span>
                      <span className="w-32 text-right text-sm tabular-nums text-muted">
                        {formatDate(row.deadline_at)}
                      </span>
                      <PixelIcon name="chevron" className="size-4 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Funnel rows={funnelRows} days={days} />
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
