-- Fix events table RLS - remove the OR condition that exposes anonymous data
DROP POLICY IF EXISTS "Users can read their own events" ON events;
DROP POLICY IF EXISTS "Anyone can insert events" ON events;

CREATE POLICY "Users can read their own events"
ON events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all events"
ON events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert events"
ON events
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Fix subscribers table - require authentication for inserts
DROP POLICY IF EXISTS "insert_subscription" ON subscribers;

CREATE POLICY "Authenticated users can create their subscription"
ON subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.email() = email);