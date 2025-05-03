# Database Migrations

This directory contains database migrations for the InstaRules application.

## Applying the Sources Migration

To add the `sources` column to the `chat_messages` table, follow these steps:

1. Ensure you have the required environment variables set up in your `.env` file:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Run the migration using the Node.js script:
   ```bash
   node supabase/db-apply-migration.js 20250331000000_add_sources.sql
   ```

3. The script will automatically:
   - Connect to your Supabase instance
   - Apply the migration to add the JSONB sources column
   - Create an index for performance optimization

4. Restart your application after applying the migration to ensure all changes take effect.

## Verifying the Migration

You can verify that the migration has been applied by:

1. Checking the database schema in the Supabase dashboard
2. Looking at the `chat_messages` table structure to confirm the `sources` column exists

## Troubleshooting

If the migration fails, the script will provide instructions for manually applying the SQL in the Supabase SQL Editor. 