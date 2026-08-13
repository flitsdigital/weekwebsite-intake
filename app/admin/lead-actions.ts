'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseLeadStatus } from '@/lib/lead-status';
import { parseLostReason } from '@/lib/copy';
import { newToken } from '@/lib/token';
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

/**
 * Het verkoopmoment: van Lead naar Intake. Zie docs/adr/0002 — dit is de enige
 * overgang tussen de twee, en hij gaat één kant op.
 *
 * De lead blijft bestaan op 'gewonnen'. Zou hij verdwijnen, dan zakt je
 * conversie structureel omdat juist de gewonnen leads uit de teller vallen.
 * Gegevens en notities worden gekopieerd, niet gedeeld: de lead is en blijft
 * het verslag van het verkoopgesprek.
 */
export async function convertLeadToIntake(id: string) {
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, company_name, contact_name, phone, email')
    .eq('id', id)
    .maybeSingle();

  if (!lead) return;

  // Dubbelklikken mag geen tweede klant opleveren.
  const { data: bestaand } = await supabaseAdmin
    .from('intakes')
    .select('id')
    .eq('lead_id', id)
    .maybeSingle();

  if (bestaand) redirect(`/admin/klanten/${bestaand.id}`);

  const { data: intake } = await supabaseAdmin
    .from('intakes')
    .insert({
      // company_name mag niet leeg zijn; een websitelead heeft alleen een naam.
      company_name: lead.company_name || lead.contact_name || 'Naamloze klant',
      contact_name: lead.contact_name,
      phone: lead.phone,
      email: lead.email,
      token: newToken(),
      lead_id: lead.id,
    })
    .select('id')
    .single();

  if (!intake) return;

  // Notities meeverhuizen als kopie, met hun oorspronkelijke tijdstip: "wil per
  // se geel in zijn logo" komt uit het verkoopgesprek en is precies wat de
  // bouwer moet weten.
  const { data: notes } = await supabaseAdmin
    .from('notes')
    .select('body, author, created_at, channel, outcome')
    .eq('lead_id', id);

  if (notes?.length) {
    await supabaseAdmin
      .from('notes')
      .insert(notes.map((note) => ({ ...note, intake_id: intake.id })));
  }

  await supabaseAdmin
    .from('leads')
    .update({ status: 'gewonnen', next_action_at: null, lost_reason: null })
    .eq('id', id);

  revalidatePath('/admin/leads');
  revalidatePath('/admin/klanten');
  redirect(`/admin/klanten/${intake.id}?nieuw=1`);
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
