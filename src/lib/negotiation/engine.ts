import type { LoadFields, CalcResult, NegotiationMargins, Equipment, NoteSuggestion } from './types';

interface RpmTargets {
  red: number;
  yellow: number;
  green: number;
}

interface SurchargePrefs {
  tarp: number;
  heavyPerMile: number;
  heavyThresholdLbs: number;
  oversizeWidth: number;
  oversizeHeight: number;
  multiStop: number;
  rush: number;
  weekend: number;
  afterHours: number;
  inside: number;
  residential: number;
  liftgate: number;
  palletJack: number;
  detentionPerHour: number;
  access: number;
  securement: number;
}

interface EquipmentProfile {
  equipment: Equipment;
  rpmTargets: RpmTargets;
  surcharges: SurchargePrefs;
}

// Equipment profiles
const hotshotProfile: EquipmentProfile = {
  equipment: 'hotshot',
  rpmTargets: { red: 1.5, yellow: 2.0, green: 2.5 },
  surcharges: {
    tarp: 100,
    heavyPerMile: 0.15,
    heavyThresholdLbs: 8000,
    oversizeWidth: 250,
    oversizeHeight: 200,
    multiStop: 75,
    rush: 150,
    weekend: 0,
    afterHours: 0,
    inside: 0,
    residential: 0,
    liftgate: 0,
    palletJack: 0,
    detentionPerHour: 50,
    access: 100,
    securement: 150,
  },
};

const cargoVanProfile: EquipmentProfile = {
  equipment: 'cargo_van',
  rpmTargets: { red: 1.2, yellow: 1.5, green: 2.0 },
  surcharges: {
    tarp: 0,
    heavyPerMile: 0,
    heavyThresholdLbs: 0,
    oversizeWidth: 0,
    oversizeHeight: 0,
    multiStop: 50,
    rush: 100,
    weekend: 75,
    afterHours: 50,
    inside: 75,
    residential: 50,
    liftgate: 0,
    palletJack: 0,
    detentionPerHour: 35,
    access: 75,
    securement: 0,
  },
};

const straightTruckProfile: EquipmentProfile = {
  equipment: 'straight_truck',
  rpmTargets: { red: 1.8, yellow: 2.2, green: 2.8 },
  surcharges: {
    tarp: 0,
    heavyPerMile: 0,
    heavyThresholdLbs: 0,
    oversizeWidth: 0,
    oversizeHeight: 0,
    multiStop: 100,
    rush: 150,
    weekend: 100,
    afterHours: 75,
    inside: 100,
    residential: 75,
    liftgate: 150,
    palletJack: 50,
    detentionPerHour: 50,
    access: 125,
    securement: 0,
  },
};

function selectProfile(equipment: Equipment): EquipmentProfile {
  switch (equipment) {
    case 'cargo_van':
      return cargoVanProfile;
    case 'straight_truck':
      return straightTruckProfile;
    case 'hotshot':
    default:
      return hotshotProfile;
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function isRush(pickupAt?: string, now = new Date()): boolean {
  if (!pickupAt) return false;
  const diffHrs = (new Date(pickupAt).getTime() - now.getTime()) / 36e5;
  return diffHrs >= 0 && diffHrs <= 6;
}

function isSecurementIntensive(itemType?: string): boolean {
  if (!itemType) return false;
  const s = itemType.toLowerCase();
  return ['coil', 'coils', 'steel coil', 'machinery', 'pipe', 'pipes', 'rebar', 'equipment', 'palletized steel'].some(
    (k) => s.includes(k)
  );
}

function colorFromRpm(rpm: number, profile: EquipmentProfile): 'red' | 'yellow' | 'green' {
  const { red, yellow, green } = profile.rpmTargets;
  if (rpm < red) return 'red';
  if (rpm < yellow) return 'yellow';
  if (rpm >= green) return 'green';
  return 'yellow';
}

export function computeCalc(fields: LoadFields, margins: NegotiationMargins, profile?: EquipmentProfile): CalcResult {
  const p = profile ?? selectProfile(fields.equipment);
  const miles = Math.max(1, Number(fields.distanceMi || 0));
  const baseFlat = Number(fields.offerFlat || 0);
  const baseRpm = round2(baseFlat / miles);

  // Shared adders across all equipment types
  const rush = isRush(fields.pickupAt) ? p.surcharges.rush : 0;
  const multiStop = fields.stops && fields.stops > 1 ? (fields.stops - 1) * p.surcharges.multiStop : 0;
  const access = fields.jobsite ? p.surcharges.access : 0;
  const detentionPerHour = fields.detentionHours ? fields.detentionHours * p.surcharges.detentionPerHour : 0;

  // Hotshot specific adders
  const isHotshot = p.equipment === 'hotshot';
  const tarp = isHotshot && fields.tarp ? p.surcharges.tarp : 0;
  const oversizeWidth = isHotshot && fields.widthFt && fields.widthFt > 8.5 ? p.surcharges.oversizeWidth : 0;
  const oversizeHeight = isHotshot && fields.heightFt && fields.heightFt > 13.5 ? p.surcharges.oversizeHeight : 0;
  const securement = isHotshot && isSecurementIntensive(fields.itemType) ? p.surcharges.securement : 0;
  const heavyPerMile =
    isHotshot && fields.weightLbs && fields.weightLbs >= p.surcharges.heavyThresholdLbs
      ? p.surcharges.heavyPerMile
      : 0;

  // Cargo van specific adders
  const isCargoVan = p.equipment === 'cargo_van';
  const weekend = isCargoVan && fields.weekend ? p.surcharges.weekend : 0;
  const afterHours = isCargoVan && fields.afterHours ? p.surcharges.afterHours : 0;

  // Straight truck specific adders
  const isStraight = p.equipment === 'straight_truck';
  const liftgate = isStraight && fields.liftgate ? p.surcharges.liftgate : 0;
  const palletJack = isStraight && fields.palletJack ? p.surcharges.palletJack : 0;

  // Inside/residential apply to cargo van & straight truck
  const inside = (isCargoVan || isStraight) && fields.inside ? p.surcharges.inside : 0;
  const residential = (isCargoVan || isStraight) && fields.residential ? p.surcharges.residential : 0;

  const sur = {
    tarp,
    heavyPerMile,
    oversizeWidth,
    oversizeHeight,
    multiStop,
    rush,
    weekend,
    afterHours,
    inside,
    residential,
    liftgate,
    palletJack,
    detentionPerHour,
    access,
    securement,
  } as const;

  const flatAdder =
    rush +
    multiStop +
    access +
    detentionPerHour +
    tarp +
    oversizeWidth +
    oversizeHeight +
    securement +
    weekend +
    afterHours +
    inside +
    residential +
    liftgate +
    palletJack;

  const heavyAdder = heavyPerMile * miles;
  const targetTotal = baseFlat + flatAdder + heavyAdder;

  const anchor = Math.round(targetTotal * (1 + margins.anchorPct));
  const target = Math.round(targetTotal * (1 + margins.targetPct));
  const floor = Math.round(targetTotal * (1 + margins.floorPct));

  return {
    baseRpm,
    surcharges: sur,
    negotiation: { anchor, target, floor },
    resultColor: colorFromRpm(baseRpm, p),
  };
}

// Template generation
function hrsToPickup(pickupAt?: string, now = new Date()): number | null {
  if (!pickupAt) return null;
  const diffMs = new Date(pickupAt).getTime() - now.getTime();
  return diffMs > 0 ? diffMs / 36e5 : null;
}

export function suggestTemplates(fields: LoadFields, calc: CalcResult, max = 3): NoteSuggestion[] {
  const out: NoteSuggestion[] = [];
  const { anchor, target } = calc.negotiation;

  switch (fields.equipment) {
    case 'hotshot':
      if (fields.widthFt && fields.widthFt > 8.5) {
        out.push({
          label: 'Oversize width surcharge',
          message: `This is ${fields.widthFt} ft wide — that's oversize and requires special routing. I need $${anchor} to cover the extra liability and permits.`,
        });
      }
      if (fields.heightFt && fields.heightFt > 13.5) {
        out.push({
          label: 'Oversize height surcharge',
          message: `At ${fields.heightFt} ft tall, this load needs oversize routing. My rate is $${anchor} to handle that complexity.`,
        });
      }
      if (fields.weightLbs && fields.weightLbs >= 8000) {
        out.push({
          label: 'Heavy load surcharge',
          message: `${fields.weightLbs} lbs is heavy for hotshot. I'll need $${anchor} to cover the extra wear and slower speed.`,
        });
      }
      if (fields.tarp) {
        out.push({
          label: 'Tarping surcharge',
          message: `Tarping adds time and labor. My rate with tarping is $${anchor}.`,
        });
      }
      if (isSecurementIntensive(fields.itemType)) {
        out.push({
          label: 'Securement intensive',
          message: `${fields.itemType} requires extra securement and care. I can do $${anchor} for this specialized haul.`,
        });
      }
      break;

    case 'cargo_van':
      if (fields.weekend) {
        out.push({
          label: 'Weekend delivery',
          message: `Weekend delivery limits my backhaul options. I'll need $${anchor} for this one.`,
        });
      }
      if (fields.afterHours) {
        out.push({
          label: 'After hours',
          message: `After-hours pickup/delivery means I'm working outside normal times. My rate is $${anchor}.`,
        });
      }
      if (fields.inside) {
        out.push({
          label: 'Inside delivery',
          message: `Inside delivery adds extra time. I can do it for $${anchor}.`,
        });
      }
      if (fields.residential) {
        out.push({
          label: 'Residential delivery',
          message: `Residential delivery can be tricky to navigate. My rate is $${anchor}.`,
        });
      }
      break;

    case 'straight_truck':
      if (fields.liftgate) {
        out.push({
          label: 'Liftgate required',
          message: `Liftgate service adds time and wear. I'll need $${anchor} for this load.`,
        });
      }
      if (fields.palletJack) {
        out.push({
          label: 'Pallet jack required',
          message: `Pallet jack work means I'm handling the freight. My rate is $${anchor}.`,
        });
      }
      if (fields.inside) {
        out.push({
          label: 'Inside delivery',
          message: `Inside delivery takes extra time and effort. I can do $${anchor}.`,
        });
      }
      if (fields.residential) {
        out.push({
          label: 'Residential delivery',
          message: `Residential can be challenging with a straight truck. My rate is $${anchor}.`,
        });
      }
      break;
  }

  // Common templates
  const hrs = hrsToPickup(fields.pickupAt);
  if (hrs !== null && hrs <= 6) {
    out.push({
      label: 'Rush pickup',
      message: `This pickup is in ${Math.round(hrs)} hours — that's rush. I'll need $${anchor} to prioritize it.`,
    });
  }

  if (fields.stops && fields.stops > 1) {
    out.push({
      label: 'Multi-stop',
      message: `${fields.stops} stops means more time and fuel. My rate for multi-stop is $${anchor}.`,
    });
  }

  if (out.length === 0) {
    // Provide three tiered templates for progressive negotiation
    const { floor } = calc.negotiation;
    out.push(
      {
        label: 'Strong Opening',
        message: `My rate for this load is $${anchor}. Let me know if that works for you.`,
      },
      {
        label: 'Counter Offer',
        message: `I appreciate the offer, but I need at least $${target} to make this work.`,
      },
      {
        label: 'Final Position',
        message: `The absolute lowest I can go is $${floor}. That's my bottom line.`,
      }
    );
  }

  return out.slice(0, max);
}
