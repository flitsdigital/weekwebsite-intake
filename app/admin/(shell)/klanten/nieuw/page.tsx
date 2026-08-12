import PageHeader from '@/components/page-header';
import { PixelIcon } from '@/components/icons';
import { createIntake } from '../../../actions';

const field = 'min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm';

export default function NieuweKlantPage() {
  return (
    <>
      <PageHeader
        title="Klant toevoegen"
        crumb={{ href: '/admin/klanten', label: 'Klanten' }}
        subtitle="Alleen de bedrijfsnaam is verplicht. De rest vult de klant zelf aan."
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        <form
          action={createIntake}
          className="grid max-w-md gap-4 rounded-ww border border-line bg-white p-6"
        >
          <Label text="Bedrijfsnaam">
            <input name="company_name" required autoFocus className={field} />
          </Label>
          <Label text="Contactpersoon">
            <input name="contact_name" className={field} />
          </Label>
          <Label text="E-mailadres">
            <input name="email" type="email" className={field} />
          </Label>
          <Label text="Telefoonnummer">
            <input name="phone" type="tel" className={field} />
          </Label>

          <button className="mt-1 flex min-h-10 items-center justify-center gap-2 rounded-ww bg-ink px-4 text-sm font-semibold text-white">
            <PixelIcon name="plus" />
            Aanmaken en link tonen
          </button>
        </form>
      </div>
    </>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">{text}</span>
      {children}
    </label>
  );
}
