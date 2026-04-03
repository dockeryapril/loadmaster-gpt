import { useMemo } from 'react';
import { computeCalc, suggestTemplates } from '@/lib/negotiation/engine';
import type { LoadFields, CalcResult, NegotiationMargins } from '@/lib/negotiation/types';
import type { LoadFormInput } from '@/types/mvp';

const DEFAULT_MARGINS: NegotiationMargins = {
  anchorPct: 0.15,  // Ask 15% above target
  targetPct: 0.08,  // Target 8% above cost
  floorPct: 0.02,   // Floor 2% above cost (break-even buffer)
};

interface NegotiationResult {
  calculation: CalcResult;
  templates: Array<{ label: string; message: string }>;
  isReady: boolean;
}

export function useNegotiationEngine(
  loadForm: LoadFormInput,
  profit: number
): NegotiationResult {
  return useMemo(() => {
    const miles = Number(loadForm.miles || 0);
    const deadheadMiles = Number(loadForm.deadheadMiles || 0);
    const baseRate = Number(loadForm.rate || 0);
    
    // Not ready if missing critical fields
    if (miles <= 0 || baseRate <= 0) {
      return {
        calculation: {
          baseRpm: 0,
          effectiveRpm: 0,
          loadedMiles: 0,
          deadheadMiles: 0,
          effectiveMiles: 0,
          surcharges: {
            tarp: 0, heavyPerMile: 0, oversizeWidth: 0, oversizeHeight: 0,
            multiStop: 0, rush: 0, weekend: 0, afterHours: 0,
            inside: 0, residential: 0, liftgate: 0, palletJack: 0,
            detentionPerHour: 0, access: 0, securement: 0,
          },
          negotiation: { anchor: 0, target: 0, floor: 0 },
          resultColor: 'red',
        },
        templates: [],
        isReady: false,
      };
    }

    // Convert LoadFormInput to LoadFields for engine
    const loadFields: LoadFields = {
      pickup: loadForm.origin,
      delivery: loadForm.destination,
      distanceMi: miles,
      deadheadMi: deadheadMiles > 0 ? deadheadMiles : undefined,
      offerFlat: baseRate,
      equipment: loadForm.equipment,
    };

    // Compute negotiation rates and surcharges
    const calculation = computeCalc(loadFields, DEFAULT_MARGINS);

    // Generate message templates
    const suggestions = suggestTemplates(loadFields, calculation, 3);
    const templates = suggestions.map(s => ({
      label: s.label,
      message: s.message,
    }));

    return {
      calculation,
      templates,
      isReady: true,
    };
  }, [loadForm, profit]);
}
