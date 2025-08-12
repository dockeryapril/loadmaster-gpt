import { supabase } from '@/integrations/supabase/client';

interface EventPayload {
  event: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export async function logEvent(event: string, data: Record<string, unknown> = {}): Promise<void> {
  const payload: EventPayload = {
    event,
    data,
    timestamp: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from<EventPayload>('log_events')
      .insert(payload);
    if (error) {
      console.error('Supabase log error:', error);
      console.log('log_event', payload);
    }
  } catch {
    console.log('log_event', payload);
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
