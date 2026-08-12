import Link from 'next/link';
import PageHeader from '@/components/page-header';
import { PixelIcon } from '@/components/icons';
import StatusDot from '@/components/status-dot';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { progressPercent } from '@/lib/progress';
import { STATUS_LABEL } from '@/lib/copy';
import { daysSince } from '@/lib/dates';
import { STATUSES, needsAttention, parseStatus } from '@/lib/intake-status';
import { TOTAL_STEPS } from '@/lib/questions';

const control = 'min-h-10 rounded-ww border border-line bg-white px-3 text-sm';

export default async function KlantenPage({ searchParams }: PageProps<'/admin/klanten'>) {
  const { status, q } = await searchParams;
  const search = typeof q === 'string' ? q.trim() : '';
  const activeStatus = parseStatus(status);

  let query = supabaseAdmin
    .from('intakes')
    .select('id, company_name, contact_name, status, answers, current_step, updated_at')
    .order('updated_at', { ascending: false });

  if (activeStatus) query = query.eq('status', activeStatus);
  if (search) query = query.ilike('company_name', `%${search}%`);

  const { data: rows } = await query;

  return (
    <>
      <PageHeader
        title="Klanten"
        subtitle={`${rows?.length ?? 0} ${rows?.length === 1 ? 'klant' : 'klanten'}`}
        action={
          <Link
            href="/admin/klanten/nieuw"
            className="flex min-h-10 items-center gap-2 rounded-ww bg-ink px-4 text-sm font-semibold text-white"
          >
            <PixelIcon name="plus" />
            Klant toevoegen
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        <form className="flex flex-wrap gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <PixelIcon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            />
            <input
              name="q"
              defaultValue={search}
              placeholder="Zoek op bedrijfsnaam"
              className={`${control} w-full pl-9`}
            />
          </div>
          <select name="status" defaultValue={activeStatus ?? ''} className={control}>
            <option value="">Alle statussen</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button className={`${control} font-semibold`}>Filter</button>
          {(search || activeStatus) && (
            <Link
              href="/admin/klanten"
              className="flex min-h-10 items-center px-2 text-sm text-muted"
            >
              Wissen
            </Link>
          )}
        </form>

        {!rows?.length ? (
          <div className="mt-6 rounded-ww border border-dashed border-line bg-white px-6 py-14 text-center">
            <p className="font-semibold">
              {search || activeStatus ? 'Niets gevonden' : 'Nog geen klanten'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {search || activeStatus
                ? 'Pas je zoekopdracht of filter aan.'
                : 'Voeg je eerste klant toe en stuur hem de intakelink.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-ww border border-line bg-white">
            <table className="w-full min-w-2xl text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
                  <th className="px-5 py-3 font-semibold">Bedrijf</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Voortgang</th>
                  <th className="px-3 py-3 font-semibold">Stap</th>
                  <th className="px-5 py-3 text-right font-semibold">Laatste activiteit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => {
                  const idle = daysSince(row.updated_at) ?? 0;
                  const attention = needsAttention(row.status, idle);
                  const percent = progressPercent(row.answers);
                  const rowStatus = parseStatus(row.status);

                  return (
                    <tr key={row.id} className="hover:bg-bg">
                      <td className="px-5 py-3">
                        <Link href={`/admin/klanten/${row.id}`} className="block">
                          <span className="font-semibold">{row.company_name}</span>
                          {row.contact_name && (
                            <span className="block text-xs text-muted">{row.contact_name}</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {rowStatus && <StatusDot status={rowStatus} label />}
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
                            <span className="block h-full bg-ink" style={{ width: `${percent}%` }} />
                          </span>
                          <span className="tabular-nums text-muted">{percent}%</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted">
                        {row.current_step}/{TOTAL_STEPS}
                      </td>
                      <td
                        className={`px-5 py-3 text-right tabular-nums ${attention ? 'font-semibold text-red-700' : 'text-muted'}`}
                      >
                        {idle === 0 ? 'vandaag' : `${idle} dagen geleden`}
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
