export type JobState = 'wachten' | 'bezig' | 'klaar' | 'fout';

export type Job = { key: string; state: JobState; progress: number };

export type RunJob = (ctx: {
  key: string;
  signal: AbortSignal;
  onProgress: (percent: number) => void;
}) => Promise<void>;

type Entry = Job & { run: RunJob; controller: AbortController | null };

export type UploadQueue = ReturnType<typeof createUploadQueue>;

/**
 * Houdt bij hoeveel uploads er tegelijk lopen en laat de rest wachten.
 * Weet niets van bestanden, HTTP of React — daardoor is het plafond testbaar.
 */
export function createUploadQueue(maxParallel: number) {
  const entries = new Map<string, Entry>();
  const waiting: string[] = [];
  const listeners = new Set<() => void>();

  let active = 0;
  let snapshot: Job[] = [];
  let stale = true;

  function emit() {
    stale = true;
    listeners.forEach((listener) => listener());
  }

  function pump() {
    while (active < maxParallel && waiting.length) {
      const entry = entries.get(waiting.shift()!);
      if (entry && entry.state === 'wachten') start(entry);
    }
  }

  function start(entry: Entry) {
    const controller = new AbortController();
    active++;
    entry.state = 'bezig';
    entry.progress = 0;
    entry.controller = controller;
    emit();

    entry
      .run({
        key: entry.key,
        signal: controller.signal,
        onProgress: (percent) => {
          if (controller.signal.aborted) return;
          entry.progress = Math.max(0, Math.min(100, Math.round(percent)));
          emit();
        },
      })
      .then(
        () => {
          // Afgebroken werk telt niet meer mee; anders registreert een verwijderd
          // bestand zich alsnog en blijft er een wees achter in Storage.
          if (controller.signal.aborted) return;
          entry.state = 'klaar';
          entry.progress = 100;
        },
        () => {
          if (controller.signal.aborted) return;
          entry.state = 'fout';
        }
      )
      .finally(() => {
        active--;
        entry.controller = null;
        emit();
        pump();
      });
  }

  return {
    add(key: string, run: RunJob) {
      entries.set(key, { key, run, state: 'wachten', progress: 0, controller: null });
      waiting.push(key);
      emit();
      pump();
    },

    retry(key: string) {
      const entry = entries.get(key);
      if (!entry || entry.state === 'bezig') return;
      entry.state = 'wachten';
      entry.progress = 0;
      waiting.push(key);
      emit();
      pump();
    },

    cancel(key: string) {
      const entry = entries.get(key);
      if (!entry) return;
      entry.controller?.abort();
      entries.delete(key);
      const queued = waiting.indexOf(key);
      if (queued !== -1) waiting.splice(queued, 1);
      emit();
    },

    /** Stabiele referentie tot er iets verandert, zodat useSyncExternalStore rust houdt. */
    jobs(): Job[] {
      if (stale) {
        snapshot = [...entries.values()].map(({ key, state, progress }) => ({
          key,
          state,
          progress,
        }));
        stale = false;
      }
      return snapshot;
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    inFlight() {
      return active;
    },
  };
}

/**
 * Eén wachtrij voor de hele pagina. Stap 3 rendert twee uploadzones (logo en
 * foto's); met een wachtrij per component was het echte plafond vier.
 */
export const sharedUploadQueue = createUploadQueue(2);
