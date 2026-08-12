import PageHeader from '@/components/page-header';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { progressPercent } from '@/lib/progress';
import { formatDate } from '@/lib/dates';
import { intakeSignal, signalText } from '@/lib/intake-signal';
import { STATUSES, parseStatus, type Status } from '@/lib/intake-status';
import Board, { type Card } from './board';

export const dynamic = 'force-dynamic';

// De kolomvolgorde is de levensloop zelf; die staat in intake-status.
const COLUMNS: readonly Status[] = STATUSES;

export default async function BordPage() {
  const { data } = await supabaseAdmin
    .from('intakes')
    .select(
      'id, company_name, contact_name, status, answers, updated_at, deadline_at, opened_at, started_at, last_customer_activity_at, current_step'
    )
    .order('updated_at', { ascending: false });

  const cards: Card[] = (data ?? []).map((row) => ({
    id: row.id,
    company_name: row.company_name,
    contact_name: row.contact_name,
    status: parseStatus(row.status) ?? 'new',
    percent: progressPercent(row.answers),
    deadline: formatDate(row.deadline_at),
    signal: signalText(
      intakeSignal({
        status: row.status,
        openedAt: row.opened_at,
        startedAt: row.started_at,
        lastCustomerActivityAt: row.last_customer_activity_at,
        currentStep: row.current_step,
      })
    ),
  }));

  return (
    <>
      <PageHeader
        title="Bord"
        subtitle="Sleep een klant naar een andere kolom om de status te wijzigen."
      />

      <div className="w-full px-6 py-8 lg:px-10">
        <Board cards={cards} columns={COLUMNS} />
      </div>
    </>
  );
}
