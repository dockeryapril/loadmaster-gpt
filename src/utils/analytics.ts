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

/**
 * Track fuel type changed
 */
export function trackFuelTypeChanged(fuelType: 'gas' | 'diesel', equipment: string) {
  return trackEvent('fuel_type_changed', { fuelType, equipment });
}

/**
 * Track industry preset applied
 */
export function trackPresetApplied(equipment: string, fuelType: 'gas' | 'diesel') {
  return trackEvent('preset_applied', { equipment, fuelType });
}

/**
 * Track preset toggle changed
 */
export function trackPresetToggled(enabled: boolean) {
  return trackEvent('preset_toggled', { enabled });
}

/**
 * Track welcome card dismissed
 */
export function trackWelcomeCardDismissed() {
  return trackEvent('welcome_card_dismissed');
}

/**
 * Track cost editor opened for first time
 */
export function trackCostEditorFirstOpen() {
  return trackEvent('cost_editor_first_open');
}

/**
 * Track optional tour started
 */
export function trackOptionalTourStarted() {
  return trackEvent('optional_tour_started');
}

/**
 * Track optional tour completed
 */
export function trackOptionalTourCompleted() {
  return trackEvent('optional_tour_completed');
}

/**
 * Track optional tour skipped
 */
export function trackOptionalTourSkipped(step: number) {
  return trackEvent('optional_tour_skipped', { step });
}

/**
 * Track affiliate panel viewed
 */
export function trackAffiliateView(placement: string, offerCount: number) {
  return trackEvent('affiliate_panel_viewed', { placement, offerCount });
}
