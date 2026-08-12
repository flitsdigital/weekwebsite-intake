import Link from 'next/link';
import PageHeader from '@/components/page-header';
import { createLead } from '../../../lead-actions';

const field =
  'min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10';

export default function NieuweLeadPage() {
  return (
    <>
      <PageHeader
        title="Lead toevoegen"
        crumb={{ href: '/admin/leads', label: 'Leads' }}
        subtitle="Voor leads die niet via Facebook binnenkomen — telefoon, via via, een beurs."
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <form action={createLead} className="rounded-ww border border-line bg-white p-6">
            <div className="grid max-w-md gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Bedrijfsnaam</span>
                <input name="company_name" autoFocus className={field} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Contactpersoon</span>
                <input name="contact_name" className={field} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Telefoonnummer</span>
                <input name="phone" type="tel" className={field} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">E-mailadres</span>
                <input name="email" type="email" className={field} />
              </label>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <button className="min-h-10 rounded-ww bg-ink px-4 text-sm font-semibold text-white">
                Lead aanmaken
              </button>
              <Link href="/admin/leads" className="text-sm text-muted hover:text-ink">
                Annuleren
              </Link>
            </div>
          </form>

          <aside className="rounded-ww border border-line bg-white p-6 text-sm">
            <h2 className="font-semibold">Eén van de drie is genoeg</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Bedrijfsnaam, naam of telefoonnummer — met minder kun je niets. De rest vul je aan
              tijdens het gesprek.
            </p>

            <h2 className="mt-5 font-semibold">Hij komt meteen op &quot;Nieuw&quot;</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Daarmee staat hij bovenaan bij Vandaag, ongeacht wat er verder gepland staat. Een
              lead die nog nooit gebeld is gaat voor alles.
            </p>

            <h2 className="mt-5 font-semibold">Facebook-leads hoef je niet in te voeren</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Die komen via Zapier vanzelf binnen, inclusief alles wat op het formulier stond.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
