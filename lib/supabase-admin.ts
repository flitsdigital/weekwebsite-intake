import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-key omzeilt RLS. Dit bestand mag nooit vanuit een client component
// geïmporteerd worden — 'server-only' laat de build falen als dat toch gebeurt.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
