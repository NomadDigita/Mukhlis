import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', publishableKey || 'placeholder');
export type Work = { id: string; title: string; description: string | null; category: string; media_type: 'audio' | 'video'; storage_path: string; created_at: string };
