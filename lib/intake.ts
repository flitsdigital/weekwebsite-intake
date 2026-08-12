import 'server-only';
import { supabaseAdmin } from './supabase-admin';
import { EDITABLE } from './intake-status.ts';

/** De intake achter deze token, maar alleen zolang de klant hem nog mag wijzigen. */
export async function openIntake(token: unknown) {
  if (typeof token !== 'string' || !token) return null;

  const { data } = await supabaseAdmin
    .from('intakes')
    .select('id')
    .eq('token', token)
    .in('status', EDITABLE)
    .maybeSingle();

  return data;
}
