import { supabase } from '@loadmaster/api';

interface EventPayload {
  event: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const LOGGING_ENABLED = process.env.NODE_ENV === 'production';

export async function logEvent(event: string, data: Record<string, unknown> = {}): Promise<void> {
  const payload: EventPayload = {
    event,
    data,
    timestamp: new Date().toISOString()
  };

  if (!LOGGING_ENABLED) {
    console.log('log_event', payload);
    return;
  }

  try {
    await supabase.from('log_events').insert(payload);
  } catch (err) {
    console.error('failed to record event log', err, payload);
  }
}

export function logOCRStart(source: string): number {
  const startTime = Date.now();
  // Fire and forget
  logEvent('ocr_start', { source, startTime }).catch(() => {});
  return startTime;
}

export function logOCREnd(
  source: string,
  startTime: number,
  success: boolean,
  error?: unknown
): void {
  const endTime = Date.now();
  const duration = endTime - startTime;
  // Fire and forget
  logEvent('ocr_end', {
    source,
    startTime,
    endTime,
    duration,
    success,
    error: error ? String(error) : undefined
  }).catch(() => {});
}
