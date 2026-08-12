'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { PixelIcon } from '@/components/icons';
import StatusDot from '@/components/status-dot';
import { STATUS_LABEL } from '@/lib/copy';
import type { Status } from '@/lib/intake-status';
import { moveIntake } from '../../actions';

export type Card = {
  id: string;
  company_name: string;
  contact_name: string | null;
  status: Status;
  percent: number;
  deadline: string | null;
  /** null als er niets aan de hand is. */
  signal: string | null;
};

export default function Board({ cards, columns }: { cards: Card[]; columns: readonly Status[] }) {
  const [optimistic, applyMove] = useOptimistic(cards, (state, moved: { id: string; status: Status }) =>
    state.map((c) => (c.id === moved.id ? { ...c, status: moved.status } : c))
  );
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const [, startTransition] = useTransition();

  function drop(status: Status) {
    setOver(null);
    const id = dragged;
    setDragged(null);
    if (!id || optimistic.find((c) => c.id === id)?.status === status) return;

    startTransition(async () => {
      applyMove({ id, status });
      await moveIntake(id, status);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((status) => {
        const items = optimistic.filter((c) => c.status === status);

        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((s) => (s === status ? null : s))}
            onDrop={() => drop(status)}
            className={`w-64 shrink-0 rounded-ww border p-2 transition ${
              over === status ? 'border-ink bg-white' : 'border-transparent bg-line/40'
            }`}
          >
            <h2 className="flex items-center gap-2 px-2 py-2 text-sm font-semibold">
              <StatusDot status={status} />
              {STATUS_LABEL[status]}
              <span className="ml-auto tabular-nums text-muted">{items.length}</span>
            </h2>

            <div className="grid gap-2">
              {items.map((card) => (
                <article
                  key={card.id}
                  draggable
                  onDragStart={() => setDragged(card.id)}
                  onDragEnd={() => setDragged(null)}
                  className={`rounded-ww border border-line bg-white p-3 ${
                    dragged === card.id ? 'opacity-40' : ''
                  }`}
                >
                  <Link href={`/admin/klanten/${card.id}`} className="block">
                    <p className="text-sm font-semibold">{card.company_name}</p>
                    {card.contact_name && (
                      <p className="text-xs text-muted">{card.contact_name}</p>
                    )}

                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                        <span className="block h-full bg-ink" style={{ width: `${card.percent}%` }} />
                      </span>
                      <span className="text-[11px] tabular-nums text-muted">{card.percent}%</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      {card.signal && (
                        <span className="flex items-center gap-1 font-semibold text-red-700">
                          <PixelIcon name="clock" className="size-3" />
                          {card.signal}
                        </span>
                      )}
                      {card.deadline && (
                        <span className="flex items-center gap-1 text-muted">
                          <PixelIcon name="zap" className="size-3" />
                          {card.deadline}
                        </span>
                      )}
                    </div>
                  </Link>
                </article>
              ))}

              {items.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted">
                  {over === status ? 'Laat hier los' : 'Leeg'}
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
