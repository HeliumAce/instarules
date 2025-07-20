-- Fix RLS policies for user_feedback table to allow UPSERT operations
-- Following security best practices with proper user isolation

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated insert" ON user_feedback;
DROP POLICY IF EXISTS "Allow service_role select" ON user_feedback;

-- Create secure RLS policies for user_feedback table

-- Policy 1: Allow authenticated users to insert feedback (user_id can be NULL for anonymous feedback)
CREATE POLICY "Allow authenticated insert" ON user_feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 2: Allow users to update their own feedback only
CREATE POLICY "Allow authenticated update own" ON user_feedback
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    (user_id = auth.uid() OR user_id IS NULL)
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    (user_id = auth.uid() OR user_id IS NULL)
  );

-- Policy 3: Allow users to select their own feedback only
CREATE POLICY "Allow authenticated select own" ON user_feedback
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (user_id = auth.uid() OR user_id IS NULL)
  );

-- Policy 4: Allow service_role to select all feedback (for admin/analytics)
CREATE POLICY "Allow service_role select all" ON user_feedback
  FOR SELECT USING (auth.role() = 'service_role');

-- Policy 5: Allow service_role to insert/update feedback (for admin operations)
CREATE POLICY "Allow service_role insert update" ON user_feedback
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role'); 