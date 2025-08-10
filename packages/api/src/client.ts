import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zvqzucpwtpjjyeldgaeg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cXp1Y3B3dHBqanllbGRnYWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDUwNDQsImV4cCI6MjA3MDE4MTA0NH0.4CsmF6Mq0N011LqWPmZVPSN8Pk8xfcIQoPbt19Xv_78";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});