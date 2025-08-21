import { useLocalStorage } from './useLocalStorage';
import type { Equipment } from '@/types/equipment';

const DEFAULT_EQUIPMENT: Equipment = 'cargo_van';

export function useEquipment() {
  const [equipment, setEquipment] = useLocalStorage<Equipment>('lm_equipment', DEFAULT_EQUIPMENT);

  return {
    equipment,
    setEquipment,
  } as const;
}
