'use client';

import { useState } from 'react';
import { LEAD_STATUS_LABEL, LOST_REASONS } from '@/lib/copy';
import { LEAD_STATUSES } from '@/lib/lead-status';

const field =
  'min-h-10 w-full rounded-ww border border-line bg-white px-3 text-sm outline-none focus:border-ink';

const label = 'text-xs font-semibold tracking-wide text-muted uppercase';

/**
 * Client component omdat de reden alleen hoort te verschijnen als je hem
 * verliest. De server action leest gewoon de formuliervelden — er gaat niets
 * mee dat de server niet al kon.
 */
export default function FollowUpFields({
  status,
  nextActionAt,
  lostReason,
}: {
  status: string;
  nextActionAt: string | null;
  lostReason: string | null;
}) {
  const [gekozen, setGekozen] = useState(status);
  const verloren = gekozen === 'verloren';

  return (
    <div className="grid gap-3 border-t border-line pt-3">
      <label className="grid gap-1">
        <span className={label}>Status van de lead</span>
        <select
          name="status"
          value={gekozen}
          onChange={(e) => setGekozen(e.target.value)}
          className={field}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className={label}>Volgende actie op</span>
        <input type="date" name="next_action_at" defaultValue={nextActionAt ?? ''} className={field} />
        <span className="text-xs text-muted">
          Leeglaten mag, maar dan valt hij onder &quot;geen vervolgactie&quot;.
        </span>
      </label>

      {verloren && (
        <label className="grid gap-1">
          <span className={label}>Waarom verloren</span>
          <select name="lost_reason" defaultValue={lostReason ?? ''} className={field} required>
            <option value="">Kies een reden</option>
            {Object.entries(LOST_REASONS).map(([value, tekst]) => (
              <option key={value} value={value}>
                {tekst}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
