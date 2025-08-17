import { useLocalStorage } from './useLocalStorage';
import type { Equipment, FlatbedSubtype } from '@/types/equipment';

const DEFAULT_EQUIPMENT: Equipment = 'flatbed';
const DEFAULT_SUBTYPE: FlatbedSubtype = 'class8_flatbed';

export function useEquipment() {
  const [equipment, setEquipment] = useLocalStorage<Equipment>('lm_equipment', DEFAULT_EQUIPMENT);
  const [equipmentSubtype, setEquipmentSubtype] =
    useLocalStorage<FlatbedSubtype | null>('lm_equipment_subtype', DEFAULT_SUBTYPE);

  return {
    equipment,
    setEquipment,
    equipmentSubtype: equipmentSubtype ?? undefined,
    setEquipmentSubtype,
  } as const;
}
