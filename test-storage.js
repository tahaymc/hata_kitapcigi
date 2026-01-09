
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Mimic frontend environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Keys missing from .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log("Checking storage buckets...");
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Storage Error:", error.message);
    } else {
        console.log("Buckets found:", data.map(b => b.name));
        const found = data.find(b => b.name === 'error-images');
        if (found) {
            console.log("✅ 'error-images' bucket exists.");
            console.log("Is Public:", found.public);
        } else {
            console.log("❌ 'error-images' bucket NOT found.");
        }
    }
}

checkStorage();
