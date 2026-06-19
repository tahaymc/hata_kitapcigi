// Tek seferlik yardimci: bot_settings.confidence_threshold degerini gunceller.
// Kullanim: node scripts/set-bot-confidence.mjs 25
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const value = Number(process.argv[2] || 25);

if (!url || !key) {
  console.error('SUPABASE_URL veya SERVICE_ROLE_KEY eksik.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await db
  .from('bot_settings')
  .update({ confidence_threshold: value })
  .eq('id', 1)
  .select('id, confidence_threshold, match_score_threshold');

if (error) {
  console.error('Guncelleme hatasi:', error.message);
  process.exit(1);
}
console.log('Guncellendi:', JSON.stringify(data));
