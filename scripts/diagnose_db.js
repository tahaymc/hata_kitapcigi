
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('🔍 Starting Database Diagnosis...');
    console.log('--------------------------------');

    // 1. Check CONNECTION
    const { data: connectionData, error: connectionError } = await supabase.from('people').select('count').single();
    if (connectionError) {
        console.error('❌ Connection Failed:', connectionError.message);
        return;
    }
    console.log('✅ Connected to Supabase (Read from "people" table successful)');

    // 2. Check ERROR_ASSIGNEES Table Existence & Access
    console.log('Testing access to "error_assignees" table...');
    const { data: assigneesData, error: assigneesError } = await supabase.from('error_assignees').select('*').limit(5);

    if (assigneesError) {
        console.error('❌ FAILED to read "error_assignees":');
        console.error('   Error Code:', assigneesError.code);
        console.error('   Message:', assigneesError.message);

        if (assigneesError.code === '42P01') {
            console.log('   👉 DIAGNOSIS: The table does not exist. (Tablo yok)');
            console.log('   👉 ACTION: You must run the CREATE TABLE SQL command.');
        } else if (assigneesError.code === '42501') {
            console.log('   👉 DIAGNOSIS: Permission Denied (RLS). (Erişim engellendi)');
            console.log('   👉 ACTION: You must run the RLS/Policy SQL command.');
        }
    } else {
        console.log('✅ Table "error_assignees" is accessible.');
        console.log(`   Count of rows found: ${assigneesData.length}`);
        if (assigneesData.length === 0) {
            console.log('   ⚠️ The table is empty. (Data might not have been saved previously due to errors)');
        } else {
            console.log('   ✅ Table has data!');
            console.log('   Sample row:', assigneesData[0]);
        }
    }

    console.log('--------------------------------');
    console.log('🏁 Diagnosis Data Complete');
}

diagnose();
