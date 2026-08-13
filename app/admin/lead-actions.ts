'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseLeadStatus } from '@/lib/lead-status';
import { parseLostReason } from '@/lib/copy';
import { addNote } from './note-actions';

function refresh(id: string) {
  revalidatePath('/admin/leads');
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath('/admin');
}

export async function createLead(formData: FormData) {
  const company = String(formData.get('company_name') ?? '').trim();
  const contact = String(formData.get('contact_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();

  // Zonder een van deze drie kun je niets met een lead.
  if (!company && !contact && !phone) return;

  const { data } = await supabaseAdmin
    .from('leads')
    .insert({
      company_name: company || null,
      contact_name: contact || null,
      phone: phone || null,
      email: String(formData.get('email') ?? '').trim() || null,
      source: 'handmatig',
      raw: { bron: 'handmatig' },
    })
    .select('id')
    .single();

  revalidatePath('/admin/leads');
  if (data) redirect(`/admin/leads/${data.id}`);
}

/**
 * Eén formulier voor het hele belletje: wat is de status geworden, wanneer moet
 * je weer wat doen, en heb je zojuist gebeld. Dat scheelt drie knoppen op het
 * moment dat je nog aan de telefoon zit.
 */
export async function saveLeadContact(id: string, formData: FormData) {
  // Eén opslag legt het contactmoment vast én werkt de lead bij; je zit aan de
  // telefoon en dan werken twee knoppen niet.
  await addNote('lead', id, formData);

  const status = parseLeadStatus(formData.get('status'));
  if (!status) return;

  const nextRaw = String(formData.get('next_action_at') ?? '').trim();
  const lostRaw = formData.get('lost_reason');

  const patch: Record<string, unknown> = {
    status,
    next_action_at: nextRaw || null,
    // Een reden hoort alleen bij een verloren lead; anders blijft er een oude staan.
    lost_reason: status === 'verloren' ? parseLostReason(lostRaw) : null,
  };

  await supabaseAdmin.from('leads').update(patch).eq('id', id);
  refresh(id);
}

export async function updateLead(id: string, formData: FormData) {
  await supabaseAdmin
    .from('leads')
    .update({
      company_name: String(formData.get('company_name') ?? '').trim() || null,
      contact_name: String(formData.get('contact_name') ?? '').trim() || null,
      phone: String(formData.get('phone') ?? '').trim() || null,
      email: String(formData.get('email') ?? '').trim() || null,
    })
    .eq('id', id);

  refresh(id);
}

export async function deleteLead(id: string) {
  await supabaseAdmin.from('leads').delete().eq('id', id);
  revalidatePath('/admin/leads');
  redirect('/admin/leads');
}
