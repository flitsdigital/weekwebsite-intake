'use client';

import { useState } from 'react';
import { PixelIcon } from '@/components/icons';
import { BELFLOW, START, isEnding, type Kind, type Tone } from '@/lib/belflow';

const KIND_LABEL: Record<Kind, string> = {
  vraag: 'Vraag',
  bezwaar: 'Bezwaar',
  doel: 'Naar het doel',
  info: 'Toelichting',
};

const KIND_STYLE: Record<Kind, string> = {
  vraag: 'bg-accent/25 text-yellow-800',
  bezwaar: 'bg-red-50 text-red-700',
  doel: 'bg-green-50 text-green-700',
  info: 'bg-blue-50 text-blue-700',
};

const TONE_STYLE: Record<Tone, string> = {
  pos: 'border-green-200 hover:border-green-700',
  mid: 'border-blue-200 hover:border-blue-700',
  neg: 'border-red-200 hover:border-red-700',
};

const OUTCOME_STYLE = {
  good: 'border-green-200 bg-green-50',
  mid: 'border-blue-200 bg-blue-50',
  bad: 'border-red-200 bg-red-50',
};

/** **vet** en *cursief*, meer opmaak heeft de tekst niet nodig. */
function inline(text: string) {
  return text.split('**').map((chunk, i) =>
    i % 2 ? (
      <strong key={i}>{chunk}</strong>
    ) : (
      <span key={i}>
        {chunk.split('*').map((part, j) => (j % 2 ? <em key={j}>{part}</em> : part))}
      </span>
    )
  );
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split('\n\n').map((paragraph, i) => (
        <p key={i} className={i ? `mt-3 ${className ?? ''}` : className}>
          {paragraph.split('\n').map((line, j) => (
            <span key={j} className={j ? 'block' : undefined}>
              {inline(line)}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

export default function Belflow() {
  const [current, setCurrent] = useState(START);
  const [path, setPath] = useState<string[]>([]);

  const node = BELFLOW[current];
  const crumbs = [...path.map((id) => BELFLOW[id].crumb), node.crumb];

  const go = (to: string) => {
    setPath([...path, current]);
    setCurrent(to);
  };

  const back = () => {
    setCurrent(path[path.length - 1]);
    setPath(path.slice(0, -1));
  };

  const reset = () => {
    setCurrent(START);
    setPath([]);
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <p className="flex-1 text-xs text-muted">
          {crumbs.map((crumb, i) => (
            <span key={i}>
              {i > 0 && <span className="px-1.5 text-line">›</span>}
              <span className={i === crumbs.length - 1 ? 'font-semibold text-ink' : undefined}>
                {crumb}
              </span>
            </span>
          ))}
        </p>
        <button
          type="button"
          onClick={back}
          disabled={path.length === 0}
          className="min-h-9 rounded-ww border border-line px-3 text-sm font-semibold disabled:opacity-40"
        >
          Terug
        </button>
        <button
          type="button"
          onClick={reset}
          className="min-h-9 rounded-ww border border-line px-3 text-sm font-semibold"
        >
          Opnieuw
        </button>
      </div>

      <section className="rounded-ww border border-line bg-white p-6 sm:p-7">
        {isEnding(node) ? (
          <>
            <Badge className="bg-bg text-muted">Einde van het gesprek</Badge>
            <h2 className="mt-4 mb-4 font-bold">{node.step}</h2>
            <div className={`rounded-ww border p-5 ${OUTCOME_STYLE[node.outcome]}`}>
              <p className="mb-3 font-semibold">{node.title}</p>
              <ul className="grid gap-2">
                {node.list.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <PixelIcon name="check" className="mt-1 size-3.5 shrink-0" />
                    <span>{inline(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-5 min-h-11 w-full rounded-ww bg-ink px-4 text-sm font-semibold text-white"
            >
              Volgende lead bellen
            </button>
          </>
        ) : (
          <>
            <Badge className={KIND_STYLE[node.kind]}>{KIND_LABEL[node.kind]}</Badge>
            <h2 className="mt-4 mb-4 font-bold">{node.step}</h2>

            <div className="grid gap-2">
              {node.say.map((line, i) => (
                <blockquote
                  key={i}
                  className="rounded-r-ww border-l-4 border-accent bg-accent/10 px-4 py-3 text-lg leading-snug"
                >
                  {inline(line)}
                </blockquote>
              ))}
            </div>

            {node.tip && (
              <div className="mt-4 border-l border-dashed border-line pl-4 text-sm text-muted">
                <Paragraphs text={node.tip} />
              </div>
            )}

            <p className="mt-6 mb-2.5 text-[11px] font-semibold tracking-wider text-muted uppercase">
              {node.question ?? 'En dan?'}
            </p>
            <div className="grid gap-2.5">
              {node.options.map((option) => (
                <button
                  key={option.to + option.label}
                  type="button"
                  onClick={() => go(option.to)}
                  className={`min-h-12 rounded-ww border-2 px-4 py-3 text-left font-semibold transition ${TONE_STYLE[option.tone]}`}
                >
                  {option.label}
                  {option.hint && (
                    <span className="block text-sm font-normal text-muted">{option.hint}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${className}`}
    >
      {children}
    </span>
  );
}
