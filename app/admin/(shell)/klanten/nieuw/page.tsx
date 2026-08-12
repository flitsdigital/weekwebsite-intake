import Link from 'next/link';
import PageHeader from '@/components/page-header';
import { PixelIcon } from '@/components/icons';
import { createIntake } from '../../../actions';

const field =
  'min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10';

const STAPPEN = [
  {
    icon: 'link' as const,
    title: 'Wij maken een unieke link',
    body: 'Niet te raden, geen account nodig. Je ziet hem meteen na het aanmaken, met een kopieerknop.',
  },
  {
    icon: 'mail' as const,
    title: 'Jij stuurt hem naar de klant',
    body: 'Via WhatsApp of mail. Zodra hij hem opent, zie je dat hier terug.',
  },
  {
    icon: 'note' as const,
    title: 'De klant vult vijf korte stappen in',
    body: 'Op zijn telefoon, in ongeveer tien minuten. Zijn antwoorden worden onderweg bewaard.',
  },
  {
    icon: 'zap' as const,
    title: 'Bij verzenden start de teller',
    body: 'Je krijgt een mail met alle antwoorden en foto’s, en de opleverdatum wordt zeven werkdagen later gezet.',
  },
];

export default function NieuweKlantPage() {
  return (
    <>
      <PageHeader
        title="Klant toevoegen"
        crumb={{ href: '/admin/klanten', label: 'Klanten' }}
        subtitle="Alleen de bedrijfsnaam is verplicht. De rest kun je later aanvullen."
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <form action={createIntake} className="rounded-ww border border-line bg-white p-6">
            <div className="grid max-w-md gap-4">
              <Veld label="Bedrijfsnaam" hint="Zoals het op de site moet komen">
                <input name="company_name" required autoFocus className={field} />
              </Veld>
              <Veld label="Contactpersoon" optioneel>
                <input name="contact_name" className={field} />
              </Veld>
              <Veld label="E-mailadres" optioneel>
                <input name="email" type="email" className={field} />
              </Veld>
              <Veld label="Telefoonnummer" optioneel hint="Handig als je moet bellen omdat het stilvalt">
                <input name="phone" type="tel" className={field} />
              </Veld>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <button className="min-h-10 rounded-ww bg-ink px-4 text-sm font-semibold text-white">
                Aanmaken en link tonen
              </button>
              <Link href="/admin/klanten" className="text-sm text-muted hover:text-ink">
                Annuleren
              </Link>
            </div>
          </form>

          <aside className="rounded-ww border border-line bg-white p-6">
            <h2 className="text-sm font-semibold">Wat er daarna gebeurt</h2>

            <ol className="mt-4 grid gap-4">
              {STAPPEN.map((stap, i) => (
                <li key={stap.title} className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-bg text-[11px] font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <PixelIcon name={stap.icon} className="size-3.5 text-muted" />
                      {stap.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{stap.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              De klant hoeft niet in te loggen en kan later verder op een ander apparaat. Foto’s
              zijn nooit verplicht — lukt uploaden niet, dan kan hij ze appen.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}

function Veld({
  label,
  hint,
  optioneel,
  children,
}: {
  label: string;
  hint?: string;
  optioneel?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline gap-2 text-sm font-semibold">
        {label}
        {optioneel && <span className="text-xs font-normal text-muted">optioneel</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}
