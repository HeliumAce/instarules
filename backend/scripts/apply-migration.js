// Script to apply migrations directly to the remote Supabase instance
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
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
const migrationFile = path.join(__dirname, '../../supabase/migrations/20230618203955_create_arcs_rules_embeddings.sql');

async function applyMigration() {
  console.log('Reading migration file...');
  let migrationSQL;
  
  try {
    migrationSQL = await fs.readFile(migrationFile, 'utf8');
    console.log('Migration file read successfully.');
  } catch (err) {
    console.error('Failed to read migration file:', err.message);
    process.exit(1);
  }
  
  console.log('The Supabase JS client does not support direct SQL execution.');
  console.log('Please apply the migration manually:');
  console.log('1. Go to https://supabase.com/dashboard/project/_/sql');
  console.log('2. Open a new query');
  console.log('3. Paste the following SQL:');
  console.log('\n' + migrationSQL);
}

applyMigration(); 