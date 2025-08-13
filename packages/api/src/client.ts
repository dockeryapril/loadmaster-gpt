import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../src/integrations/supabase/types.ts';

const SUPABASE_URL = 'https://zvqzucpwtpjjyeldgaeg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cXp1Y3B3dHBqanllbGRnYWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDUwNDQsImV4cCI6MjA3MDE4MTA0NH0.4CsmF6Mq0N011LqWPmZVPSN8Pk8xfcIQoPbt19Xv_78';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
