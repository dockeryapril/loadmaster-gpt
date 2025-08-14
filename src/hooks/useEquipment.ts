import { useLocalStorage } from './useLocalStorage';
import type { Equipment, FlatbedSubtype } from '@/types/equipment';

const DEFAULT_EQUIPMENT: Equipment = 'flatbed';
const DEFAULT_SUBTYPE: FlatbedSubtype = 'class8_flatbed';

export function useEquipment() {
  const [equipmentSubtype, setEquipmentSubtype] = useLocalStorage<FlatbedSubtype>('lm_equipment_subtype', DEFAULT_SUBTYPE);
  // Equipment is fixed for now but returned for completeness
  const equipment: Equipment = DEFAULT_EQUIPMENT;
  return { equipment, equipmentSubtype, setEquipmentSubtype } as const;
}
