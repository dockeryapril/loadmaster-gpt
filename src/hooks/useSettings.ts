import { useLocalStorage } from './useLocalStorage';
import { UserSettings, defaultUserSettings } from '@/types/load';

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<UserSettings>('loadmaster-settings', defaultUserSettings);
  
  return [settings, setSettings] as const;
}