import { useEffect, useState } from 'react';
import { Copy, Plus, Save, UserRound, X } from 'lucide-react';
import { newDriverProfile, useDriverProfileStore } from '@/store/useDriverProfileStore';
import type { CompensationTargets, OperationMode } from '@/types/driverProfile';
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
  const [draft, setDraft] = useState<{ name: string; carrier: string; operationMode: OperationMode; equipment: Equipment; compensationTargets: CompensationTargets } | null>(null);

  const active = profiles.find((profile) => profile.id === activeProfileId) ?? null;

  useEffect(() => {
    setDraft(active ? { name: active.name, carrier: active.carrier || '', operationMode: active.operationMode, equipment: active.equipment, compensationTargets: active.compensationTargets || { targetLoadedMileRate: 0, minimumLoadedMileRate: 0, targetDeadheadRate: 0, minimumDeadheadRate: 0, targetFlatPay: 0, minimumFlatPay: 0, targetPercentage: 0, minimumPercentage: 0 } } : null);
  }, [activeProfileId, active?.name, active?.carrier, active?.operationMode, active?.equipment, active?.compensationTargets]);

  const saveDraft = () => { if (active && draft) updateProfile(active.id, { ...draft, name: draft.name.trim() || active.name }); };
  const resetDraft = () => { if (active) setDraft({ name: active.name, carrier: active.carrier || '', operationMode: active.operationMode, equipment: active.equipment, compensationTargets: active.compensationTargets || { targetLoadedMileRate: 0, minimumLoadedMileRate: 0, targetDeadheadRate: 0, minimumDeadheadRate: 0, targetFlatPay: 0, minimumFlatPay: 0, targetPercentage: 0, minimumPercentage: 0 } }); };
  const duplicateActive = () => {
    if (!active) return;
    const fresh = newDriverProfile(active.name + ' copy');
    addProfile({ ...active, id: fresh.id, name: fresh.name, compensation: { ...active.compensation }, compensationTargets: { ...(active.compensationTargets || { targetLoadedMileRate: 0, minimumLoadedMileRate: 0, targetDeadheadRate: 0, minimumDeadheadRate: 0, targetFlatPay: 0, minimumFlatPay: 0, targetPercentage: 0, minimumPercentage: 0 }) }, costs: { ...active.costs } });
    setActiveProfile(fresh.id);
  };

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

      {active && draft && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">Edit a draft below. Nothing changes in the saved profile until you choose Save profile.</p>
          <div><label className="text-xs font-medium text-muted-foreground">Profile name</label><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">Carrier / company (optional)</label><input value={draft.carrier} onChange={(e) => setDraft({ ...draft, carrier: e.target.value })} placeholder="Enter any carrier or company" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Operation</label><select value={draft.operationMode} onChange={(e) => setDraft({ ...draft, operationMode: e.target.value as OperationMode })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="solo">Solo</option><option value="team">Team</option></select></div>
            <div><label className="text-xs font-medium text-muted-foreground">Equipment</label><select value={draft.equipment} onChange={(e) => setDraft({ ...draft, equipment: e.target.value as Equipment })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">{equipmentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold">Your compensation targets</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Optional. When set, LoadMaster uses these instead of a generic percentage bump.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {([
                ['targetLoadedMileRate', 'Target loaded $/mi'],
                ['minimumLoadedMileRate', 'Minimum loaded $/mi'],
                ['targetDeadheadRate', 'Target deadhead $/mi'],
                ['minimumDeadheadRate', 'Minimum deadhead $/mi'],
                ['targetFlatPay', 'Target flat pay'],
                ['minimumFlatPay', 'Minimum flat pay'],
                ['targetPercentage', 'Target percentage'],
                ['minimumPercentage', 'Minimum percentage'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
                  <input type="number" min="0" step="0.01" value={draft.compensationTargets[key] || ''} onChange={(e) => setDraft({ ...draft, compensationTargets: { ...draft.compensationTargets, [key]: Number(e.target.value || 0) } })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveDraft} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"><Save className="h-3.5 w-3.5" /> Save profile</button>
            <button type="button" onClick={resetDraft} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium"><X className="h-3.5 w-3.5" /> Discard edits</button>
            <button type="button" onClick={duplicateActive} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium"><Copy className="h-3.5 w-3.5" /> Duplicate profile</button>
          </div>
          <p className="text-[11px] text-muted-foreground">Temporary calculator changes do not automatically rewrite this saved profile.</p>
        </div>
      )}

    </section>
  );
}
