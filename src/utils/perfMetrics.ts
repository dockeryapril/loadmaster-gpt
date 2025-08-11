import { supabase } from '@/integrations/supabase/client';

interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface ExtendedPerformance extends Performance {
  memory?: MemoryInfo;
}

type MetricMap = Record<string, number>;

const metrics: MetricMap = {};

function captureMemory(): void {
  const memory = (performance as ExtendedPerformance).memory;
  if (memory) {
    metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    metrics.totalJSHeapSize = memory.totalJSHeapSize;
    metrics.usedJSHeapSize = memory.usedJSHeapSize;
  }
}

function sendMetrics(): void {
  const payload = {
    metrics,
    timestamp: new Date().toISOString()
  };

  (supabase as any).from('perf_metrics').insert(payload as any).then(({ error }) => {
    if (error) {
      console.error('Supabase perf metrics error:', error);
      console.log('perf_metrics', payload);
    }
  }).catch(() => {
    console.log('perf_metrics', payload);
  });
}

export function initPerfMetrics(): void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return;
  }

  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      metrics[entry.name] = entry.startTime;
    }
  });
  if (PerformanceObserver.supportedEntryTypes?.includes('paint')) {
    paintObserver.observe({ type: 'paint', buffered: true });
  }

  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics['largest-contentful-paint'] = lastEntry.startTime;
  });
  if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navEntry) {
    metrics['dom-content-loaded'] = navEntry.domContentLoadedEventEnd;
    metrics['load'] = navEntry.loadEventEnd;
  }

  captureMemory();

  const finalize = () => {
    paintObserver.disconnect();
    lcpObserver.disconnect();
    captureMemory();
    sendMetrics();
  };

  window.addEventListener('beforeunload', finalize);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      finalize();
    }
  });
}
