import { supabase } from '@/integrations/supabase/client';

interface ErrorLogPayload {
  message: string;
  error: string;
  stack?: string;
  context?: any;
  timestamp: string;
}

const LOGGING_ENABLED = import.meta.env.MODE === 'production';

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

  if (!LOGGING_ENABLED) {
    console.log('error_log', payload);
    return;
  }

  try {
    // TODO: Create error_logs table or use alternative logging
    console.log('error_log', payload);
  } catch (err) {
    console.error('failed to record error log', err, payload);
  }
}

