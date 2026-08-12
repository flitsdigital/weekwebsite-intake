'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSessionClient } from '@/lib/supabase-server';

export type NoteTarget = 'lead' | 'intake';

const MAX_LENGTH = 5000;

function refresh(target: NoteTarget, id: string) {
  revalidatePath(target === 'lead' ? `/admin/leads/${id}` : `/admin/klanten/${id}`);
}

async function currentEmail() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

export async function addNote(target: NoteTarget, id: string, body: string) {
  const text = body.trim();
  if (!text) return;

  await supabaseAdmin.from('notes').insert({
    [target === 'lead' ? 'lead_id' : 'intake_id']: id,
    body: text.slice(0, MAX_LENGTH),
    author: await currentEmail(),
  });

  refresh(target, id);
}

/**
 * Notities worden niet bewerkt — een regel van vorige maand hoort niet te
 * veranderen. Verwijderen kan wel: een verkeerd geplakte regel is erger dan
 * een gat in de geschiedenis.
 */
export async function deleteNote(target: NoteTarget, id: string, noteId: string) {
  await supabaseAdmin.from('notes').delete().eq('id', noteId);
  refresh(target, id);
}
