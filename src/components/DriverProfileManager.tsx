import { useState } from 'react';
import { Plus, UserRound } from 'lucide-react';
import { newDriverProfile, useDriverProfileStore } from '@/store/useDriverProfileStore';
import type { OperationMode } from '@/types/driverProfile';
import type { Equipment } from '@/types/mvp';

const equipmentOptions: Array<{ value: Equipment; label: string }> = [
  { value: 'cargo_van', label: 'Cargo van' },
  { value: 'straight_truck', label: 'Straight truck' },
  { value: 'hotshot', label: 'Hotshot' },
];

export function DriverProfileManager() {
  const profiles = useDriverProfileStore((state) => state.profiles);
  const activeProfileId = useDriverProfileStore((state) => state.activeProfileId);
  const addProfile = useDriverProfileStore((state) => state.addProfile);
  const updateProfile = useDriverProfileStore((state) => state.updateProfile);
  const setActiveProfile = useDriverProfileStore((state) => state.setActiveProfile);
  const [newName, setNewName] = useState('');

  const active = profiles.find((profile) => profile.id === activeProfileId) ?? null;

  const createProfile = () => {
    const profile = newDriverProfile(newName.trim() || `Driving profile ${profiles.length + 1}`);
    addProfile(profile);
    setNewName('');
  };

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <UserRound className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-semibold">Driver profiles</p>
          <p className="text-xs text-muted-foreground">Save different contracts, equipment and operating setups.</p>
        </div>
      </div>

      {profiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setActiveProfile(profile.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                profile.id === activeProfileId
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:border-primary'
              }`}
            >
              {profile.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="e.g. Straight Truck Team"
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <button type="button" onClick={createProfile} className="rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {active && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Profile name</label>
            <input value={active.name} onChange={(e) => updateProfile(active.id, { name: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Carrier / company (optional)</label>
            <input value={active.carrier || ''} onChange={(e) => updateProfile(active.id, { carrier: e.target.value })} placeholder="Enter any carrier or company" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Operation</label>
              <select value={active.operationMode} onChange={(e) => updateProfile(active.id, { operationMode: e.target.value as OperationMode })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="solo">Solo</option>
                <option value="team">Team</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Equipment</label>
              <select value={active.equipment} onChange={(e) => updateProfile(active.id, { equipment: e.target.value as Equipment })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {equipmentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Team status is independent of carrier. Compensation and costs belong to this profile, so the same setup works with any carrier or contract.
          </p>
        </div>
      )}
    </section>
  );
}
