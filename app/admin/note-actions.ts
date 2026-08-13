'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSessionClient } from '@/lib/supabase-server';
import { parseContact } from '@/lib/contact-moment';

export type NoteTarget = 'lead' | 'intake';

const MAX_LENGTH = 5000;

// Niet exporteren: in een 'use server'-bestand moet elke export een async
// server action zijn.
function pathFor(target: NoteTarget, id: string) {
  return target === 'lead' ? `/admin/leads/${id}` : `/admin/klanten/${id}`;
}

async function currentEmail() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

/**
 * Eén regel in de tijdlijn. Met kanaal én uitkomst is het een contactmoment,
 * zonder allebei een losse aantekening. De tijdstempels op de lead worden door
 * een databasetrigger bijgewerkt, niet hier.
 */
export async function addNote(target: NoteTarget, id: string, formData: FormData) {
  const body = String(formData.get('body') ?? '').trim();
  const contact = parseContact(formData.get('channel'), formData.get('outcome'));

  // Zonder tekst en zonder contact valt er niets vast te leggen.
  if (!body && !contact) return;

  await supabaseAdmin.from('notes').insert({
    [target === 'lead' ? 'lead_id' : 'intake_id']: id,
    body: body.slice(0, MAX_LENGTH) || contactOnlyBody(contact),
    author: await currentEmail(),
    channel: contact?.channel ?? null,
    outcome: contact?.outcome ?? null,
  });

  revalidatePath(pathFor(target, id));
}

/** Een contactmoment zonder toelichting krijgt toch een leesbare regel. */
function contactOnlyBody(contact: { channel: string; outcome: string } | null) {
  return contact ? 'Geen toelichting' : '';
}

/**
 * Bewerken kan niet — een regel van vorige maand hoort niet te veranderen.
 * Verwijderen wel: een verkeerd gekozen kanaal is erger dan een gat. De
 * trigger rekent de reactietijd daarna opnieuw uit.
 */
export async function deleteNote(target: NoteTarget, id: string, noteId: string) {
  await supabaseAdmin.from('notes').delete().eq('id', noteId);
  revalidatePath(pathFor(target, id));
}
