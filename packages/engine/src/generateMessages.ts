import type { LoadFields, CalcResult } from './types';
function topN<T>(arr: T[], n: number): T[] { return arr.slice(0, n); }
function hrsToPickup(pickupAt?: string, now = new Date()): number | null {
  if (!pickupAt) return null;
  const diffMs = new Date(pickupAt).getTime() - now.getTime();
  return Math.round(diffMs / 36e5 * 10) / 10;
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
  const stops = fields.stops || 1;

  switch (fields.equipment) {
    case 'hotshot': {
      const oversizeAmt = calc.surcharges.oversizeWidth + calc.surcharges.oversizeHeight;
      if (oversizeAmt > 0 && ((fields.widthFt && fields.widthFt > 8.5) || (fields.heightFt && fields.heightFt > 13.5))) {
        out.push({ templateId: 't_oversize', message: `Oversize at ${fields.widthFt ?? ''}${fields.widthFt ? ' ft wide' : ''}${fields.heightFt && fields.heightFt > 13.5 ? ` x ${fields.heightFt} ft tall` : ''} means extra routing and permits. Add $${oversizeAmt} and I can roll with it.` });
      }
      if (calc.surcharges.heavyPerMile > 0) {
        const heavyTotal = Math.round((calc.surcharges.heavyPerMile * (fields.distanceMi || 0)));
        out.push({ templateId: 't_heavy', message: `${fields.weightLbs ?? 'This load'} puts us into heavier axle wear and fuel burn. Need $${heavyTotal} more to make it work.` });
      }
      if (fields.tarp && calc.surcharges.tarp > 0) {
        out.push({ templateId: 't_tarp', message: `Rate looks light for a tarped load — tarping runs $${calc.surcharges.tarp} on top of base. Let’s get that added and I can lock it in.` });
      }
      if (h2p <= 6 && calc.surcharges.rush > 0) {
        out.push({ templateId: 't_rush', message: `Pickup in ${h2p} hrs — short notice. Rush pay is $${calc.surcharges.rush} for hotshot. Add that and I’ll be there.` });
      }
      if (stops > 1 && calc.surcharges.multiStop > 0) {
        out.push({ templateId: 't_multistop', message: `Multiple stops (${fields.stops}) = more time and unload/load labor. Add $${calc.surcharges.multiStop} and I can commit.` });
      }
      if (isSecurementIntensive(fields.itemType) && calc.surcharges.securement > 0) {
        out.push({ templateId: 't_securement', message: `${fields.itemType} needs extra securement — more straps/chains = more labor. Add $${calc.surcharges.securement} and I can lock it in.` });
      }
      break;
    }
    case 'cargo_van': {
      if (h2p <= 6 && calc.surcharges.rush > 0) {
        out.push({ templateId: 't_rush_van', message: `Pickup in ${h2p} hrs — tight for a van. Rush pay is $${calc.surcharges.rush}. Add that and I’ll lock it in.` });
      }
      if (fields.weekend && calc.surcharges.weekend > 0) {
        out.push({ templateId: 't_weekend', message: `Weekend run needs an extra $${calc.surcharges.weekend}. Add it and I can haul it.` });
      }
      if (fields.afterHours && calc.surcharges.afterHours > 0) {
        out.push({ templateId: 't_afterhours', message: `After-hours pickup takes extra coordination. Add $${calc.surcharges.afterHours} and we’re set.` });
      }
      if (fields.inside && calc.surcharges.inside > 0) {
        out.push({ templateId: 't_inside_van', message: `Inside delivery means extra time. Toss in $${calc.surcharges.inside} and I’ll handle it.` });
      }
      if (fields.residential && calc.surcharges.residential > 0) {
        out.push({ templateId: 't_residential_van', message: `Residential stop adds time navigating neighborhoods. Add $${calc.surcharges.residential} and I’m in.` });
      }
      if (stops > 1 && calc.surcharges.multiStop > 0) {
        out.push({ templateId: 't_multistop_van', message: `Multiple stops (${fields.stops}) = more handling. Need $${calc.surcharges.multiStop} more to make it work.` });
      }
      break;
    }
    case 'straight_truck': {
      if (fields.liftgate && calc.surcharges.liftgate > 0) {
        out.push({ templateId: 't_liftgate', message: `Liftgate service takes extra gear and time. Add $${calc.surcharges.liftgate} and I’ll bring the gate.` });
      }
      if (fields.residential && calc.surcharges.residential > 0) {
        out.push({ templateId: 't_residential_st', message: `Residential stop takes more time and tight turns. Add $${calc.surcharges.residential} and I can commit.` });
      }
      if (fields.inside && calc.surcharges.inside > 0) {
        out.push({ templateId: 't_inside_st', message: `Inside delivery means more labor. Need $${calc.surcharges.inside} added and I’ll take care of it.` });
      }
      if (fields.palletJack && calc.surcharges.palletJack > 0) {
        out.push({ templateId: 't_palletjack', message: `Pallet jack required — equipment and effort. Add $${calc.surcharges.palletJack} and I’ll include it.` });
      }
      if (h2p <= 6 && calc.surcharges.rush > 0) {
        out.push({ templateId: 't_rush_st', message: `Pickup in ${h2p} hrs — short notice for a straight truck. Rush pay is $${calc.surcharges.rush}. Add that and I’ll be there.` });
      }
      if (stops > 1 && calc.surcharges.multiStop > 0) {
        out.push({ templateId: 't_multistop_st', message: `Multiple stops (${fields.stops}) take time. Add $${calc.surcharges.multiStop} and I can run it.` });
      }
      break;
    }
    default:
      break;
  }

  out.push({ templateId: 't_anchor', message: `Given ${fields.distanceMi} mi${fields.weightLbs ? `, ${fields.weightLbs} lbs` : ''}${isSecurementIntensive(fields.itemType) ? ' and securement' : ''}, best I can do is $${calc.negotiation.anchor}. If we can meet at $${calc.negotiation.target}, we’ve got a deal.` });
  return topN(out, max);
}
