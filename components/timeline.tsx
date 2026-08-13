import { PixelIcon } from '@/components/icons';
import {
  CHANNELS,
  CHANNEL_LABEL,
  OUTCOMES,
  OUTCOME_LABEL,
  contactLabel,
} from '@/lib/contact-moment';

export type Note = {
  id: string;
  body: string;
  author: string | null;
  created_at: string;
  channel: string | null;
  outcome: string | null;
};

const field =
  'min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm outline-none focus:border-ink';

const moment = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export default function Timeline({
  save,
  remove,
  notes,
  extra,
}: {
  save: (formData: FormData) => Promise<void>;
  remove: (noteId: string) => Promise<void>;
  notes: Note[];
  /** Velden die bij dezelfde opslag horen, zoals status en vervolgdatum. */
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <form action={save} className="grid gap-3">
        <textarea
          name="body"
          rows={3}
          placeholder="Wat is er gezegd?"
          className={`${field} resize-y py-2`}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              Contact
            </span>
            <select name="channel" defaultValue="" className={field}>
              <option value="">Geen — losse aantekening</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              Uitkomst
            </span>
            <select name="outcome" defaultValue="" className={field}>
              <option value="">—</option>
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {OUTCOME_LABEL[o]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="-mt-1 text-xs text-muted">
          Kies allebei om er een contactmoment van te maken. Laat ze leeg voor een gewone
          aantekening.
        </p>

        {extra}

        <button className="min-h-10 rounded-ww bg-ink px-4 text-sm font-semibold text-white">
          Vastleggen
        </button>
      </form>

      {notes.length > 0 && (
        <ol className="mt-6 grid gap-4 border-t border-line pt-5">
          {notes.map((note) => {
            const contact = contactLabel(note.channel, note.outcome);

            return (
              <li key={note.id} className="group flex gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${contact ? 'bg-ink' : 'bg-line'}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
                    <time dateTime={note.created_at}>{moment(note.created_at)}</time>
                    {contact && <span className="font-semibold text-ink">{contact}</span>}
                    {note.author && <span className="truncate">· {note.author}</span>}
                  </p>
                  <p className="mt-0.5 text-sm whitespace-pre-line">{note.body}</p>
                </div>

                <form action={remove.bind(null, note.id)}>
                  <button
                    aria-label="Regel verwijderen"
                    className="opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                  >
                    <PixelIcon name="trash" className="size-3.5 text-muted hover:text-red-700" />
                  </button>
                </form>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
