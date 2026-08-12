'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';
import { PixelIcon } from '@/components/icons';
import { addNote, deleteNote, type NoteTarget } from '@/app/admin/note-actions';

export type Note = {
  id: string;
  body: string;
  author: string | null;
  created_at: string;
};

const moment = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export default function Notes({
  target,
  id,
  notes,
}: {
  target: NoteTarget;
  id: string;
  notes: Note[];
}) {
  const [optimistic, addOptimistic] = useOptimistic(notes, (state, note: Note) => [note, ...state]);
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);

  /** Geen opslaanknop: wegklikken of Cmd+Enter legt de regel vast. */
  function commit() {
    const body = box.current?.value.trim();
    if (!body) return;

    if (box.current) box.current.value = '';
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);

    startTransition(async () => {
      addOptimistic({
        id: `tijdelijk-${body.length}-${body.slice(0, 8)}`,
        body,
        author: null,
        created_at: new Date().toISOString(),
      });
      await addNote(target, id, body);
    });
  }

  return (
    <div>
      <textarea
        ref={box}
        rows={3}
        placeholder="Typ wat er gezegd is. Wegklikken bewaart het."
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
        }}
        className="w-full resize-y rounded-ww border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
      />

      <p className="mt-1 h-4 text-xs text-muted" aria-live="polite">
        {saved ? 'Bewaard' : 'Cmd + Enter bewaart ook.'}
      </p>

      {optimistic.length > 0 && (
        <ol className="mt-4 grid gap-3">
          {optimistic.map((note) => (
            <li key={note.id} className="group border-l-2 border-line pl-3">
              <p className="flex items-baseline gap-2 text-xs text-muted">
                <time dateTime={note.created_at}>{moment(note.created_at)}</time>
                {note.author && <span className="truncate">· {note.author}</span>}

                {!note.id.startsWith('tijdelijk-') && (
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteNote(target, id, note.id);
                      })
                    }
                    aria-label="Notitie verwijderen"
                    className="ml-auto opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                  >
                    <PixelIcon name="trash" className="size-3.5 text-muted hover:text-red-700" />
                  </button>
                )}
              </p>
              <p className="mt-0.5 text-sm whitespace-pre-line">{note.body}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
