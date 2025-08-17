import type { FusedResult } from './fuse'

export function logExtractionEvent(result: FusedResult) {
  try {
    const payload = {
      ...result
    }
    // In real app this would send to telemetry backend
    console.debug('extraction_event', JSON.stringify(payload))
  } catch {
    // noop
  }
}

