'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { compressImage } from '@/lib/compress';
import { sharedUploadQueue } from '@/lib/upload-queue';
import type { Question } from '@/lib/questions';

export type ExistingFile = { id: string; name: string; url: string };

/** Wat de component zelf bijhoudt; de wachtrij kent alleen sleutels en voortgang. */
type Item = {
  key: string;
  name: string;
  preview: string;
  fileId?: string;
};

/** PUT met voortgang. fetch kan geen uploadvoortgang geven, XHR wel. */
function put(url: string, file: File, signal: AbortSignal, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('content-type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error('netwerk'));
    signal.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

export default function Upload({
  q,
  token,
  initial,
  whatsapp,
}: {
  q: Question;
  token: string;
  initial: ExistingFile[];
  whatsapp?: string;
}) {
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((f) => ({ key: f.id, name: f.name, preview: f.url, fileId: f.id }))
  );
  const [notice, setNotice] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const jobs = useSyncExternalStore(
    sharedUploadQueue.subscribe,
    sharedUploadQueue.jobs,
    sharedUploadQueue.jobs
  );

  const max = q.max ?? 30;
  const isLogo = q.kind === 'logo';

  /** Geen job betekent: al geüpload in een eerdere sessie. */
  const stateOf = (key: string) => jobs.find((j) => j.key === key)?.state ?? 'klaar';
  const progressOf = (key: string) => jobs.find((j) => j.key === key)?.progress ?? 100;

  async function transfer(
    key: string,
    file: File,
    signal: AbortSignal,
    onProgress: (p: number) => void
  ) {
    const signed = await fetch('/api/intake/upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, contentType: file.type, kind: q.kind }),
      signal,
    });
    if (!signed.ok) throw new Error('signen mislukt');
    const { uploadUrl, path } = await signed.json();

    await put(uploadUrl, file, signal, onProgress);

    const registered = await fetch('/api/intake/file', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        path,
        kind: q.kind,
        originalName: file.name,
        bytes: file.size,
      }),
      signal,
    });
    if (!registered.ok) throw new Error('vastleggen mislukt');
    const { id } = await registered.json();

    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, fileId: id } : i)));
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    setNotice(null);

    const room = max - items.length;
    if (room <= 0) {
      setNotice(
        isLogo
          ? 'Je hebt al een logo staan. Verwijder dat eerst als je een ander wilt.'
          : `Je kunt maximaal ${max} foto's kwijt.`
      );
      return;
    }
    if (picked.length > room) setNotice(`We nemen er ${room}, meer passen er niet bij.`);

    for (const original of picked.slice(0, room)) {
      const file = await compressImage(original);
      const key = crypto.randomUUID();

      setItems((prev) => [
        ...prev,
        {
          key,
          name: original.name,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        },
      ]);

      sharedUploadQueue.add(key, ({ signal, onProgress }) =>
        transfer(key, file, signal, onProgress)
      );
    }
  }

  async function remove(item: Item) {
    sharedUploadQueue.cancel(item.key); // breekt een lopende upload af
    setItems((prev) => prev.filter((i) => i.key !== item.key));
    if (item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);

    if (item.fileId) {
      await fetch('/api/intake/file', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, fileId: item.fileId }),
      });
    }
  }

  const done = items.filter((i) => stateOf(i.key) === 'klaar').length;
  const togo = q.min ? q.min - done : 0;

  return (
    <div>
      <p className="font-semibold leading-snug">{q.label}</p>
      {q.help && <p className="mt-1 text-sm text-muted">{q.help}</p>}

      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {items.map((item) => {
            const state = stateOf(item.key);
            const progress = progressOf(item.key);

            return (
              <li
                key={item.key}
                className="relative aspect-square overflow-hidden rounded-ww border border-line bg-white"
              >
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center p-2 text-center text-xs break-all text-muted">
                    {item.name}
                  </span>
                )}

                {state !== 'klaar' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/70 p-2 text-center text-xs text-white">
                    {state === 'fout' ? (
                      <>
                        <span>Mislukt</span>
                        <button
                          type="button"
                          onClick={() => sharedUploadQueue.retry(item.key)}
                          className="min-h-12 rounded-full bg-white px-4 font-semibold text-ink"
                        >
                          Opnieuw
                        </button>
                      </>
                    ) : (
                      <>
                        <span>{progress}%</span>
                        <span className="h-1 w-4/5 overflow-hidden rounded-full bg-white/30">
                          <span
                            className="block h-full bg-accent transition-[width]"
                            style={{ width: `${progress}%` }}
                          />
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Raakvlak 48 px, cirkel zichtbaar 32 px — dit is de knop die je
                    aantikt als een upload op 4G misgaat. */}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`${item.name} verwijderen`}
                  className="absolute top-0 right-0 flex size-12 items-center justify-center"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-ink/80 text-lg leading-none text-white">
                    ×
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        multiple={!isLogo}
        accept={isLogo ? 'image/*,application/pdf' : 'image/*'}
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="mt-3 min-h-12 w-full rounded-ww border-2 border-dashed border-line bg-white px-4 py-3 text-base font-semibold"
      >
        {items.length ? 'Nog meer toevoegen' : isLogo ? 'Kies je logo' : "Kies foto's"}
      </button>

      {notice && <p className="mt-2 text-sm text-red-700">{notice}</p>}
      {togo > 0 && (
        <p className="mt-2 text-sm text-muted">
          Nog {togo} {togo === 1 ? 'foto' : "foto's"} en je zit goed. Het hoeft niet, maar het
          scheelt je site een hoop.
        </p>
      )}

      {whatsapp && !isLogo && (
        <p className="mt-2 text-sm text-muted">
          Lukt het uploaden niet? App ze naar{' '}
          <a className="underline" href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}>
            {whatsapp}
          </a>
          .
        </p>
      )}
    </div>
  );
}
