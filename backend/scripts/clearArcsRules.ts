import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL and Service Role Key must be provided in environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false,
    }
});

async function clearTable() {
    try {
        console.log('🧹 Clearing arcs_rules_embeddings table...');
        
        // Get current count
        const { count: beforeCount, error: countError } = await supabaseAdmin
            .from('arcs_rules_embeddings')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error(`❌ Error getting count: ${countError.message}`);
            return;
        }
        
        console.log(`   Current rows: ${beforeCount}`);
        
        // Clear all data
        const { error: deleteError } = await supabaseAdmin
            .from('arcs_rules_embeddings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (using a UUID that won't exist)
            
        if (deleteError) {
            console.error(`❌ Error clearing table: ${deleteError.message}`);
            return;
        }
        
        // Verify it's empty
        const { count: afterCount, error: verifyError } = await supabaseAdmin
            .from('arcs_rules_embeddings')
            .select('*', { count: 'exact', head: true });
            
        if (verifyError) {
            console.error(`❌ Error verifying: ${verifyError.message}`);
            return;
        }
        
        console.log(`✅ Table cleared! Rows: ${beforeCount} → ${afterCount}`);
        console.log(`\nNow run: npx tsx backend/scripts/ingestArcsRules.ts`);
        
    } catch (error: any) {
        console.error(`💥 Clear failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    clearTable();
} 