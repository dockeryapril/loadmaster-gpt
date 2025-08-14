import type { LoadFields, CalcResult } from './types.js';

function topN<T>(arr: T[], n: number): T[] { return arr.slice(0, n); }

function hrsToPickup(pickupAt?: string, now = new Date()): number | null {
  if (!pickupAt) return null;
  const diffMs = new Date(pickupAt).getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
}

function isSecurementIntensive(itemType?: string): boolean {
  if (!itemType) return false;
  const s = itemType.toLowerCase();
  return ['coil','coils','steel coil','machinery','pipe','pipes','rebar','equipment','palletized steel'].some(k => s.includes(k));
}

export interface NoteSuggestion { templateId: string; message: string; }

export function suggestTemplates(fields: LoadFields, calc: CalcResult, max = 3): NoteSuggestion[] {
  const out: NoteSuggestion[] = [];
  const h2p = hrsToPickup(fields.pickupAt) ?? 999;

  // 1) Oversize
  if ((fields.widthFt && fields.widthFt > 8.5) || (fields.heightFt && fields.heightFt > 13.5)) {
    out.push({ templateId: 't_oversize', message: `Oversize at ${fields.widthFt ?? ''}${fields.widthFt ? ' ft wide' : ''}${fields.heightFt && fields.heightFt > 13.5 ? ` x ${fields.heightFt} ft tall` : ''} means extra routing and permits. Add $${calc.surcharges.oversizeWidth + calc.surcharges.oversizeHeight} and I can roll with it.` });
  }

  // 2) Heavy
  if (calc.surcharges.heavyPerMile > 0) {
    const heavyTotal = Math.round((calc.surcharges.heavyPerMile * (fields.distanceMi || 0)));
    out.push({ templateId: 't_heavy', message: `${fields.weightLbs ?? 'This load'} puts us into heavier axle wear and fuel burn. Need $${heavyTotal} more to make it work.` });
  }

  // 3) Tarp
  if (fields.tarp) {
    out.push({ templateId: 't_tarp', message: `Rate looks light for a tarped load — tarping runs $${calc.surcharges.tarp} on top of base. Let’s get that added and I can lock it in.` });
  }

  // 4) Rush
  if (h2p <= 6) {
    out.push({ templateId: 't_rush', message: `Pickup in ${h2p} hrs — short notice. Rush pay is $${calc.surcharges.rush} for flatbed. Add that and I’ll be there.` });
  }

  // 5) Multi-stop
  if ((fields.stops || 1) > 1) {
    out.push({ templateId: 't_multistop', message: `Multiple stops (${fields.stops}) = more time and unload/load labor. Add $${calc.surcharges.multiStop} and I can commit.` });
  }

  // 6) Securement-intensive
  if (isSecurementIntensive(fields.itemType)) {
    out.push({ templateId: 't_securement', message: `${fields.itemType} needs extra securement — more straps/chains = more labor. Add $${calc.surcharges.securement} and I can lock it in.` });
  }

  // 8) Anchor (fallback)
  out.push({ templateId: 't_anchor', message: `Given ${fields.distanceMi} mi${fields.weightLbs ? `, ${fields.weightLbs} lbs` : ''}${isSecurementIntensive(fields.itemType) ? ' and securement' : ''}, best I can do is $${calc.negotiation.anchor}. If we can meet at $${calc.negotiation.target}, we’ve got a deal.` });

  return topN(out, max);
}
