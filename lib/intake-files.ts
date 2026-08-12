import type { SupabaseClient } from '@supabase/supabase-js';
import { BUCKET } from './storage.ts';

export type IntakeFile = {
  id: string;
  kind: string;
  name: string;
  /** null als het bestand niet (meer) in Storage staat. */
  url: string | null;
};

type FileRow = {
  id: string;
  kind: string;
  storage_path: string;
  original_name: string | null;
};

type SignedEntry = { path?: string | null; signedUrl?: string | null };

/**
 * De twee dingen die deze module van de buitenwereld nodig heeft. Als parameter,
 * zodat de koppellogica getest kan worden zonder Supabase — en zodat dit bestand
 * `supabase-admin` (met `server-only`) niet hoeft te importeren.
 */
export type FileStore = {
  rowsFor: (intakeId: string) => Promise<FileRow[]>;
  signPaths: (paths: string[], expiresIn: number) => Promise<SignedEntry[] | null>;
};

/**
 * Haalt de bestanden van een intake op met een tijdelijke link erbij.
 *
 * Koppelt op pad in plaats van op index: de opslag geeft geen volgordegarantie,
 * en bij een verschuiving zou de verkeerde foto achter de verkeerde knop komen.
 */
export async function listIntakeFiles(
  store: FileStore,
  intakeId: string,
  expiresIn: number
): Promise<IntakeFile[]> {
  const rows = await store.rowsFor(intakeId);
  if (!rows.length) return [];

  const signed = await store.signPaths(
    rows.map((row) => row.storage_path),
    expiresIn
  );

  const byPath = new Map<string, string>();
  for (const entry of signed ?? []) {
    if (entry.path && entry.signedUrl) byPath.set(entry.path, entry.signedUrl);
  }

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    name: row.original_name ?? 'bestand',
    url: byPath.get(row.storage_path) ?? null,
  }));
}

/** De echte opslag. Krijgt de client mee omdat `supabase-admin` server-only is. */
export function supabaseFileStore(db: SupabaseClient): FileStore {
  return {
    rowsFor: async (intakeId) => {
      const { data } = await db
        .from('intake_files')
        .select('id, kind, storage_path, original_name')
        .eq('intake_id', intakeId)
        .order('created_at');
      return (data ?? []) as FileRow[];
    },
    signPaths: async (paths, expiresIn) => {
      const { data } = await db.storage.from(BUCKET).createSignedUrls(paths, expiresIn);
      return data;
    },
  };
}
