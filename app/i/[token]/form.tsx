'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STEPS, TOTAL_STEPS, visibleQuestions } from '@/lib/questions';
import Field from './field';
import type { ExistingFile } from './upload';

type Answers = Record<string, string>;

export default function IntakeForm({
  token,
  companyName,
  initialAnswers,
  initialStep,
  files,
  whatsapp,
}: {
  token: string;
  companyName: string;
  initialAnswers: Answers;
  initialStep: number;
  files: Record<string, ExistingFile[]>;
  whatsapp?: string;
}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [step, setStep] = useState(initialStep);
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const router = useRouter();
  const current = STEPS[step - 1];

  const stepRef = useRef(step);

  async function save(nextAnswers: Answers, nextStep: number) {
    try {
      const res = await fetch('/api/intake/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, answers: nextAnswers, step: nextStep }),
      });
      setProblem(
        res.ok ? null : 'Opslaan lukte even niet. Blijf typen, we proberen het opnieuw.'
      );
    } catch {
      setProblem('Opslaan lukte even niet. Blijf typen, we proberen het opnieuw.');
    }
  }

  // Tijdens typen met 800 ms vertraging opslaan. Stapwissels slaan direct op, in go().
  const mounted = useRef(false);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Meld één keer dat de link geopend is. Vanuit de browser, want linkvoorbeelden
  // van WhatsApp en iMessage voeren geen JavaScript uit.
  useEffect(() => {
    fetch('/api/intake/opened', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      keepalive: true,
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // De timer leest de stap pas als hij afgaat. Sloot hij zich om `step`, dan
    // schreef hij na een stapwissel de oude stap terug over de nieuwe heen.
    pending.current = setTimeout(() => save(answers, stepRef.current), 800);
    return () => clearTimeout(pending.current ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  async function submit() {
    setSending(true);
    await save(answers, step); // laatste toetsaanslagen eerst vastleggen
    try {
      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error('verzenden mislukt');
      router.push(`/i/${token}/klaar`);
    } catch {
      setSending(false);
      setProblem('Versturen lukte niet. Controleer je verbinding en probeer het nog eens.');
    }
  }

  function go(nextStep: number) {
    if (pending.current) clearTimeout(pending.current); // anders volgt er een tweede, overbodige opslag
    setStep(nextStep);
    stepRef.current = nextStep;
    save(answers, nextStep);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-10 bg-bg">
        <div className="h-1 w-full bg-line">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="mx-auto flex w-full max-w-xl items-baseline justify-between px-5 py-3">
          <span className="text-sm text-muted">
            Stap {step} van {TOTAL_STEPS}
          </span>
          <span className="truncate pl-3 text-sm text-muted">{companyName}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-8">
        <h1 className="text-2xl font-bold leading-tight">{current.title}</h1>
        {current.subtitle && <p className="mt-1 text-muted">{current.subtitle}</p>}

        <div className="mt-8 grid gap-8">
          {visibleQuestions(current, answers).map((q) => (
            <Field
              key={q.key}
              q={q}
              value={answers[q.key] ?? ''}
              onChange={(value) => setAnswers((a) => ({ ...a, [q.key]: value }))}
              token={token}
              files={files}
              whatsapp={whatsapp}
            />
          ))}
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-line bg-bg">
        <div className="mx-auto w-full max-w-xl px-5 py-3">
          <p
            aria-live="polite"
            className={`mb-2 text-center text-sm ${problem ? 'text-red-700' : 'text-muted'}`}
          >
            {problem ?? 'Je antwoorden worden automatisch bewaard.'}
          </p>
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="min-h-12 rounded-ww border border-line bg-white px-5 text-base font-semibold"
              >
                Terug
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => go(step + 1)}
                className="min-h-12 flex-1 rounded-ww bg-btn px-5 text-base font-semibold text-white"
              >
                Volgende
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="min-h-12 flex-1 rounded-ww bg-ink px-5 text-base font-semibold text-white disabled:opacity-60"
              >
                {sending ? 'Bezig met versturen…' : 'Versturen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
