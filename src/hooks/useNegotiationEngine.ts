import { useMemo } from 'react';
import { computeCalc, suggestTemplates, type LoadFields } from '../../packages/engine/src/index';
import { NegotiationCalculation } from '@/types/negotiation';
import { Load } from '@/types/load';
import { useEquipment } from '@/hooks/useEquipment';
import type { Equipment, FlatbedSubtype, EquipmentType } from '@/types/equipment';

interface UseNegotiationEngineProps {
  load: Partial<Load>;
  laneBaselineRpm?: number;
}

export function useNegotiationEngine({ load, laneBaselineRpm }: UseNegotiationEngineProps) {
  const { equipment, equipmentSubtype } = useEquipment();
  const result = useMemo(() => {
    if (!load.miles || !load.rate) return null;

    const eq: Equipment = load.equipment ?? equipment;
    const subtype: FlatbedSubtype = load.equipmentSubtype ?? equipmentSubtype ?? 'class8_flatbed';

    const flatbedMap: Record<FlatbedSubtype, EquipmentType> = {
      class8_flatbed: 'flatbed',
      hotshot: 'hotshot',
    };

    const equipmentTypeMap: Record<Equipment, EquipmentType> = {
      flatbed: flatbedMap[subtype],
      cargo_van: 'cargo_van',
      straight_truck: 'straight_truck',
      tractor: 'tractor',
    };

    const equipmentType = equipmentTypeMap[eq];

    const fields: LoadFields = {
      distanceMi: load.miles,
      offerFlat: load.rate,
      weightLbs: load.weight,
      widthFt: load.widthFt,
      heightFt: load.heightFt,
      stops: load.stops,
      ...(load.accessorials ?? {}),
      pickupAt: load.pickupAt,
      equipment: equipmentType === 'hotshot' ? 'flatbed' : equipmentType,
      equipmentSubtype: equipmentType === 'hotshot' ? 'hotshot' : subtype,
    };

    const margins = { anchorPct: 0.18, targetPct: 0.10, floorPct: 0.00 };
    const calc = computeCalc(fields, margins);
    const notes = suggestTemplates(fields, calc, 3);
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
