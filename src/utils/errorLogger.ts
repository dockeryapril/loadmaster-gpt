import { supabase } from '@/integrations/supabase/client';

interface ErrorLogPayload {
  message: string;
  error: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export async function logError(
  message: string,
  error: unknown,
  context: Record<string, unknown> = {}
): Promise<void> {
  const payload: ErrorLogPayload = {
    message,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString()
  };

  // Log to console instead since error_logs table doesn't exist
  console.log('error_log', payload);
}
