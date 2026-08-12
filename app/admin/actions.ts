'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSessionClient } from '@/lib/supabase-server';
import { parseStatus } from '@/lib/intake-status';
import { parseStallReason } from '@/lib/copy';
import { BUCKET } from '@/lib/storage';

/** Twee UUID's zonder streepjes: 64 tekens, niet oplopend, niet te raden. */
const newToken = () => (randomUUID() + randomUUID()).replace(/-/g, '');

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function createIntake(formData: FormData) {
  const companyName = String(formData.get('company_name') ?? '').trim();
  if (!companyName) return;

  const { data } = await supabaseAdmin
    .from('intakes')
    .insert({
      company_name: companyName,
      contact_name: String(formData.get('contact_name') ?? '').trim() || null,
      email: String(formData.get('email') ?? '').trim() || null,
      phone: String(formData.get('phone') ?? '').trim() || null,
      token: newToken(),
    })
    .select('id')
    .single();

  revalidatePath('/admin/klanten');
  if (data) redirect(`/admin/klanten/${data.id}?nieuw=1`);
}

export async function updateIntake(id: string, formData: FormData) {
  await supabaseAdmin
    .from('intakes')
    .update({
      company_name: String(formData.get('company_name') ?? '').trim(),
      contact_name: String(formData.get('contact_name') ?? '').trim() || null,
      email: String(formData.get('email') ?? '').trim() || null,
      phone: String(formData.get('phone') ?? '').trim() || null,
    })
    .eq('id', id);

  revalidatePath(`/admin/klanten/${id}`);
}

export async function updateStatus(id: string, formData: FormData) {
  const status = parseStatus(formData.get('status'));
  if (!status) return;

  await supabaseAdmin.from('intakes').update({ status }).eq('id', id);
  revalidatePath(`/admin/klanten/${id}`);
  revalidatePath('/admin');
}

/** Versleepvariant voor het bord; de statuscheck is dezelfde. */
export async function moveIntake(id: string, next: string) {
  const status = parseStatus(next);
  if (!status) return;

  await supabaseAdmin.from('intakes').update({ status }).eq('id', id);
  revalidatePath('/admin/bord');
  revalidatePath('/admin/klanten');
  revalidatePath('/admin');
}

export async function saveStallReason(id: string, formData: FormData) {
  const raw = formData.get('stall_reason');
  const reason = raw === '' ? null : parseStallReason(raw);
  if (raw !== '' && !reason) return;

  await supabaseAdmin.from('intakes').update({ stall_reason: reason }).eq('id', id);
  revalidatePath(`/admin/klanten/${id}`);
}

/** Stempelt wanneer je voor het laatst herinnerd hebt. */
export async function markReminded(id: string) {
  await supabaseAdmin
    .from('intakes')
    .update({ last_reminder_at: new Date().toISOString() })
    .eq('id', id);
  revalidatePath(`/admin/klanten/${id}`);
}

export async function saveNotes(id: string, formData: FormData) {
  await supabaseAdmin
    .from('intakes')
    .update({ notes: String(formData.get('notes') ?? '') })
    .eq('id', id);

  revalidatePath(`/admin/klanten/${id}`);
}

export async function regenerateToken(id: string) {
  await supabaseAdmin.from('intakes').update({ token: newToken() }).eq('id', id);
  revalidatePath(`/admin/klanten/${id}`);
}

export async function deleteIntake(id: string) {
  const { data: files } = await supabaseAdmin
    .from('intake_files')
    .select('storage_path')
    .eq('intake_id', id);

  if (files?.length) {
    await supabaseAdmin.storage.from(BUCKET).remove(files.map((f) => f.storage_path));
  }

  // intake_files gaat mee via de foreign key met on delete cascade.
  await supabaseAdmin.from('intakes').delete().eq('id', id);

  revalidatePath('/admin/klanten');
  redirect('/admin/klanten');
}
