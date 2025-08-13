import { supabase } from '@loadmaster/api';

interface ErrorLogPayload {
  message: string;
  error: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const LOGGING_ENABLED = process.env.NODE_ENV === 'production';

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
    await supabase.from('error_logs').insert(payload);
  } catch (err) {
    console.error('failed to record error log', err, payload);
  }
}

