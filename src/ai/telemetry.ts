import { supabase } from '@loadmaster/api';

interface ExtractionEventPayload {
  source: string;
  success: boolean;
  duration: number; // milliseconds
  error?: string;
  timestamp: string;
}

interface ErrorPayload {
  message: string;
  error: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const LOGGING_ENABLED = import.meta.env.MODE === 'production';

export async function recordExtractionEvent(payload: Omit<ExtractionEventPayload, 'timestamp'>): Promise<void> {
  const data: ExtractionEventPayload = { ...payload, timestamp: new Date().toISOString() };

  if (!LOGGING_ENABLED) {
    console.log('ai_extraction_event', data);
    return;
  }

  try {
    await supabase.from('ai_extraction_events').insert(data);
  } catch (err) {
    console.error('failed to record extraction event', err, data);
  }
}

export async function recordError(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
  const payload: ErrorPayload = {
    message: 'ai_extraction_error',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  if (!LOGGING_ENABLED) {
    console.log('ai_extraction_error', payload);
    return;
  }

  try {
    await supabase.from('error_logs').insert(payload);
  } catch (err) {
    console.error('failed to record error log', err, payload);
  }
}
