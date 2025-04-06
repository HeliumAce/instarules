// Script to apply migrations directly to the remote Supabase instance
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

// Read the migration file
const migrationFile = path.join(__dirname, 'migrations', '20230618203955_create_arcs_rules_embeddings.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

async function applyMigration() {
  console.log('Applying migration to remote Supabase instance...');
  
  try {
    // Execute the SQL directly
    const { error } = await supabase.rpc('pgmigrate', { query: migrationSQL });
    
    if (error) {
      // If direct RPC fails, try alternative approach
      console.log('RPC method failed, trying direct SQL execution...');
      const { error: sqlError } = await supabase.sql(migrationSQL);
      
      if (sqlError) {
        throw new Error(sqlError.message);
      } else {
        console.log('Migration applied successfully!');
      }
    } else {
      console.log('Migration applied successfully!');
    }
  } catch (err) {
    console.error('Failed to apply migration:', err.message);
    console.log('\nAlternative: Copy the SQL from the migration file and execute it in the Supabase SQL Editor:');
    console.log('1. Go to https://supabase.com/dashboard/project/_/sql');
    console.log('2. Open a new query');
    console.log('3. Paste the SQL from supabase/migrations/20230618203955_create_arcs_rules_embeddings.sql');
    console.log('4. Execute the query');
  }
}

applyMigration(); 