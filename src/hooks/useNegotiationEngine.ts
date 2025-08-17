import { useMemo } from 'react';
import { computeCalc, suggestTemplates } from '../../packages/engine/src/index';
import { NegotiationCalculation } from '@/types/negotiation';
import { Load } from '@/types/load';
import { useEquipment } from '@/hooks/useEquipment';

interface UseNegotiationEngineProps {
  load: Partial<Load>;
  laneBaselineRpm?: number;
}

export function useNegotiationEngine({ load, laneBaselineRpm }: UseNegotiationEngineProps) {
  const { equipment, equipmentSubtype } = useEquipment();
  const result = useMemo(() => {
    if (!load.miles || !load.rate) return null;
    const fields = {
      distanceMi: load.miles,
      offerFlat: load.rate,
      weightLbs: load.weight,
      widthFt: load.widthFt,
      heightFt: load.heightFt,
      stops: load.stops,
      ...(load.accessorials ?? {}),
      pickupAt: load.pickupAt,
      equipment: load.equipment ?? equipment,
      equipmentSubtype: load.equipmentSubtype ?? equipmentSubtype,
    };
    const margins = { anchorPct: 0.18, targetPct: 0.10, floorPct: 0.00 };
    const calc = computeCalc(fields as any, margins);
    const notes = suggestTemplates(fields as any, calc, 3);
    const calculation: NegotiationCalculation = {
      anchor_rate: calc.negotiation.anchor,
      target_rate: calc.negotiation.target,
      floor_rate: calc.negotiation.floor,
      base_rpm: calc.baseRpm,
      premiums_applied: notes.map(n => n.templateId),
      lane_baseline_rpm: laneBaselineRpm,
      suggested_strategy: 'standard',
    };
    return { calculation, notes, resultColor: calc.resultColor };
  }, [load, laneBaselineRpm, equipment, equipmentSubtype]);
  return { ...(result ?? {}), isReady: !!result };
}
