import { create } from '@/lib/zustand';
import { persist } from '@/lib/zustand/middleware';
import { createDriverProfile, type DriverProfile } from '@/types/driverProfile';

interface DriverProfileState {
  profiles: DriverProfile[];
  activeProfileId: string | null;
  addProfile: (profile: DriverProfile) => void;
  updateProfile: (id: string, updates: Partial<DriverProfile>) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
}

export const useDriverProfileStore = create<DriverProfileState>()(
  persist(
    (set) => ({
      profiles: [],
      activeProfileId: null,
      addProfile: (profile) =>
        set((state) => ({
          profiles: [...state.profiles, profile],
          activeProfileId: state.activeProfileId ?? profile.id,
        })),
      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === id ? { ...profile, ...updates } : profile,
          ),
        })),
      removeProfile: (id) =>
        set((state) => {
          const profiles = state.profiles.filter((profile) => profile.id !== id);
          return {
            profiles,
            activeProfileId:
              state.activeProfileId === id ? profiles[0]?.id ?? null : state.activeProfileId,
          };
        }),
      setActiveProfile: (id) => set({ activeProfileId: id }),
    }),
    { name: 'lm:driver-profiles' },
  ),
);

export function newDriverProfile(name?: string) {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return createDriverProfile(id, name);
}
