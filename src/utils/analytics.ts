import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
}

interface EventPayload {
  [key: string]: any;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  eventName: string,
  payload: EventPayload = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('events').insert({
      event_name: eventName,
      payload,
      session_id: getSessionId(),
      user_id: user?.id || null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.debug('Analytics tracking failed:', error);
  }
}

/**
 * Track calculation submission
 */
export function trackCalculationSubmitted(data: {
  miles: number;
  rate: number;
  profit: number;
  netRPM: number;
  shareRPM: number;
}) {
  return trackEvent('calculation_submitted', data);
}

/**
 * Track negotiation assistant opened
 */
export function trackNegotiationOpened() {
  return trackEvent('negotiation_opened');
}

/**
 * Track decision logged (Book it / Counter / Pass)
 */
export function trackDecisionLogged(decisionType: 'book' | 'counter' | 'pass') {
  return trackEvent('decision_logged', { decisionType });
}

/**
 * Track feedback link clicked
 */
export function trackFeedbackClicked() {
  return trackEvent('feedback_clicked');
}

/**
 * Track screenshot uploaded for OCR
 */
export function trackScreenshotUploaded() {
  return trackEvent('screenshot_uploaded');
}

/**
 * Track session start
 */
export function trackSessionStart() {
  return trackEvent('session_start', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Track cost assumptions edited
 */
export function trackCostAssumptionsEdited() {
  return trackEvent('cost_assumptions_edited');
}
