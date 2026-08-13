'use client';

import type { Question } from '@/lib/questions';
import Upload, { type ExistingFile } from './upload';

// text-base is 16px: kleiner laat iOS bij focus op het veld inzoomen.
const control =
  'w-full min-h-12 rounded-ww border border-line bg-white px-4 py-3 text-base ' +
  'outline-none focus:border-ink focus:ring-2 focus:ring-ink/10';

export default function Field({
  q,
  value,
  onChange,
  token,
  files,
  whatsapp,
}: {
  q: Question;
  value: string;
  onChange: (value: string) => void;
  token: string;
  files: Record<string, ExistingFile[]>;
  whatsapp?: string;
}) {
  // Stelt gerust bij een keuze, slaat niets op.
  if (q.type === 'info') {
    return (
      <div className="rounded-ww border border-line bg-white px-4 py-3">
        <p className="font-semibold leading-snug">{q.label}</p>
        {q.help && <p className="mt-1 text-sm text-muted">{q.help}</p>}
      </div>
    );
  }

  if (q.type === 'upload') {
    return (
      <Upload
        q={q}
        token={token}
        initial={files[q.kind ?? 'photo'] ?? []}
        whatsapp={whatsapp}
      />
    );
  }

  return (
    <div>
      <label htmlFor={q.key} className="block font-semibold leading-snug">
        {q.label}
      </label>
      {q.help && <p className="mt-1 text-sm text-muted">{q.help}</p>}

      <div className="mt-3">
        {q.type === 'radio' ? (
          <div role="radiogroup" aria-labelledby={q.key} className="grid gap-2">
            {q.options?.map((option) => {
              const active = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange(option)}
                  className={`min-h-12 rounded-ww border px-4 py-3 text-left text-base transition ${
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-white hover:border-muted'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : q.type === 'textarea' ? (
          <textarea
            id={q.key}
            rows={4}
            value={value}
            placeholder={q.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`${control} resize-y`}
          />
        ) : (
          <input
            id={q.key}
            type={q.type}
            value={value}
            placeholder={q.placeholder}
            inputMode={q.type === 'tel' ? 'tel' : undefined}
            autoComplete={
              { tel: 'tel', email: 'email', url: 'url' }[q.type as string] ?? 'off'
            }
            onChange={(e) => onChange(e.target.value)}
            className={control}
          />
        )}
      </div>
    </div>
  );
}
