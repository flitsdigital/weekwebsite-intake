'use client';

import { useEffect, useState } from 'react';
import { PixelIcon } from '@/components/icons';
import { createBrowserClient } from '@supabase/ssr';

const REASONS: Record<string, string> = {
  inloggen: 'Log in om verder te gaan.',
  'geen-toegang': 'Dit e-mailadres staat niet op de lijst. Vraag Jordi om je toe te voegen.',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');

  // Na het renderen uitlezen, niet tijdens: de server kent de queryreeks niet en
  // rendert de melding dus niet mee. Direct uitlezen levert een hydratiefout op.
  const [reason, setReason] = useState<string>();
  useEffect(() => {
    setReason(REASONS[new URLSearchParams(window.location.search).get('reden') ?? '']);
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState('busy');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/auth/callback` },
    });
    setState(error ? 'error' : 'sent');
  }

  return (
    <main className="m-auto w-full max-w-sm px-6 py-16">
      <div className="rounded-ww border border-line bg-white p-7">
        <div className="mb-6">
          <p className="text-lg font-bold">Weekwebsite</p>
          <p className="text-sm text-muted">Backoffice</p>
        </div>

        {state === 'sent' ? (
          <div className="flex gap-3 rounded-ww bg-bg p-4 text-sm">
            <PixelIcon name="mail" className="mt-0.5 size-4 shrink-0" />
            <p>
              Check je mail. We hebben een inloglink naar <strong>{email}</strong> gestuurd.
            </p>
          </div>
        ) : (
          <form onSubmit={send} className="grid gap-3">
            {reason && <p className="text-sm text-muted">{reason}</p>}
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                E-mailadres
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@flitsdigital.nl"
                className="min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={state === 'busy'}
              className="flex min-h-10 items-center justify-center gap-2 rounded-ww bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              <PixelIcon name="mail" />
              {state === 'busy' ? 'Bezig…' : 'Stuur me een inloglink'}
            </button>
            {state === 'error' && (
              <p className="text-sm text-red-700">Versturen lukte niet. Probeer het nog eens.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
