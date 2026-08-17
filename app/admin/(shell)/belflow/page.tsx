import PageHeader from '@/components/page-header';
import { PixelIcon } from '@/components/icons';
import Belflow from '@/components/belflow';
import { CHEATSHEET, CHEATSHEET_TODO } from '@/lib/belflow';

export default function BelflowPage() {
  return (
    <>
      <PageHeader title="Belflow" subtitle="Bel binnen vijf minuten. Sluit af in dit gesprek." />

      <div className="mx-auto grid w-full max-w-5xl gap-5 px-6 py-8 lg:grid-cols-[1.7fr_1fr] lg:px-10">
        <Belflow />

        <aside className="grid content-start gap-5">
          <section className="overflow-hidden rounded-ww border border-line bg-white">
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-semibold">
              <PixelIcon name="note" className="size-4 text-muted" />
              Spiekbriefje
            </h2>
            <dl className="grid gap-3 p-5 text-sm">
              {CHEATSHEET.map(([term, value]) => (
                <div key={term} className="border-l-2 border-line pl-3">
                  <dt className="text-xs text-muted">{term}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="border-t border-line bg-red-50 px-5 py-4 text-sm text-red-700">
              {CHEATSHEET_TODO}
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
