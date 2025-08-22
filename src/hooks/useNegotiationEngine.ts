import { useMemo } from 'react';
import { computeCalc, suggestTemplates, type LoadFields } from '../../packages/engine/src/index';
import { NegotiationCalculation } from '@/types/negotiation';
import { Load } from '@/types/load';
import { useEquipment } from '@/hooks/useEquipment';
import type { Equipment } from '@/types/equipment';
import { useAuth } from '@/contexts/AuthContext';
import { getFeatureFlags } from '@/utils/featureFlags';
import { isPro } from '@/utils/tier';

interface UseNegotiationEngineProps {
  load: Partial<Load>;
  laneBaselineRpm?: number;
}

export function useNegotiationEngine({ load, laneBaselineRpm }: UseNegotiationEngineProps) {
  const { equipment } = useEquipment();
  const { user } = useAuth();
  const { advancedTemplates } = getFeatureFlags(user);
  const isProTier = isPro();
  const result = useMemo(() => {
    if (!load.miles || !load.rate) return null;

    const eq: Equipment = load.equipment ?? equipment;

    const fields: LoadFields = {
      distanceMi: load.miles,
      offerFlat: load.rate,
      weightLbs: load.weight,
      widthFt: load.widthFt,
      heightFt: load.heightFt,
      stops: load.stops,
      ...(load.accessorials ?? {}),
      pickupAt: load.pickupAt,
      equipment: eq,
    };

    const margins = { anchorPct: 0.18, targetPct: 0.10, floorPct: 0.00 };
    const calc = computeCalc(fields, margins);
    const notes = (advancedTemplates && isProTier) ? suggestTemplates(fields, calc, 3) : [];
    const calculation: NegotiationCalculation = {
      anchor_rate: calc.negotiation.anchor,
      target_rate: calc.negotiation.target,
      floor_rate: calc.negotiation.floor,
      base_rpm: calc.baseRpm,
      premiums_applied: (advancedTemplates && isProTier) ? notes.map(n => n.templateId) : [],
      lane_baseline_rpm: laneBaselineRpm,
      suggested_strategy: 'standard',
    };
    return { calculation, notes, resultColor: calc.resultColor };
  }, [load, laneBaselineRpm, equipment, advancedTemplates, isProTier]);
  return { ...(result ?? {}), isReady: !!result };
}
