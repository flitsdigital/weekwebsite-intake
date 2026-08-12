import Link from 'next/link';
import { buildFunnel, type FunnelRow } from '@/lib/funnel';

export default function Funnel({
  rows,
  days,
}: {
  rows: FunnelRow[];
  /** null = alles ooit */
  days: number | null;
}) {
  const stages = buildFunnel(rows);
  const total = stages[0].count;

  return (
    // <details> doet het in- en uitklappen zonder JavaScript.
    <details className="mt-6 overflow-hidden rounded-ww border border-line bg-white">
      <summary className="cursor-pointer px-5 py-3 text-sm font-semibold marker:text-muted">
        Trechter
        <span className="ml-2 font-normal text-muted">
          {total} {total === 1 ? 'intake' : 'intakes'}
          {days ? ` · laatste ${days} dagen` : ' · alles'}
        </span>
      </summary>

      <div className="border-t border-line px-5 py-4">
        <nav className="mb-4 flex gap-2 text-xs">
          <Toggle active={days === null} href="/admin">
            Alles
          </Toggle>
          <Toggle active={days === 90} href="/admin?periode=90">
            Laatste 90 dagen
          </Toggle>
        </nav>

        {total === 0 ? (
          <p className="text-sm text-muted">Nog geen intakes in deze periode.</p>
        ) : (
          <ol className="grid gap-1.5">
            {stages.map((stage, i) => {
              const previous = i > 0 ? stages[i - 1].count : stage.count;
              const lost = previous - stage.count;

              return (
                <li key={stage.key} className="flex items-center gap-3 text-sm">
                  <span className="w-44 shrink-0 truncate">{stage.label}</span>
                  <span className="h-5 flex-1 overflow-hidden rounded bg-bg">
                    <span
                      className="block h-full bg-ink transition-[width]"
                      style={{ width: `${stage.percent}%` }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right font-semibold tabular-nums">
                    {stage.count}
                  </span>
                  <span className="w-12 shrink-0 text-right tabular-nums text-muted">
                    {stage.percent}%
                  </span>
                  <span className="w-20 shrink-0 text-right text-xs tabular-nums">
                    {i > 0 && lost > 0 ? (
                      <span className="text-red-700">−{lost} hier</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <p className="mt-4 text-xs text-muted">
          Percentages zijn van het totaal aangemaakt. Afgehaakte intakes tellen mee — dat is
          juist de dure uitkomst. Waaróm iemand stopte staat op de klantpagina; dat vult een
          mens in na een telefoontje.
        </p>
      </div>
    </details>
  );
}

function Toggle({
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
      className={`rounded-ww px-2.5 py-1 ${active ? 'bg-ink text-white' : 'border border-line text-muted'}`}
    >
      {children}
    </Link>
  );
}
