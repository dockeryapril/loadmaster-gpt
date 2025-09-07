import { useLocalStorage } from './useLocalStorage';
import type { Equipment } from '@/types/equipment';

export function useEquipment() {
  const [equipment, setEquipment] = useLocalStorage<Equipment | undefined>('lm_equipment', undefined);

  return {
    equipment,
    setEquipment,
  } as const;
}
