export type Channel = 'text' | 'email' | 'phone';
export type Tone = 'professional' | 'driver' | 'firm';
export type Equipment = 'hotshot' | 'cargo_van' | 'straight_truck';

export interface ScriptOptions {
  ask: number;
  settle: number;
  bottom: number;
  channel: Channel;
  tone: Tone;
  equipment: Equipment;
  miles?: number;
  isRush?: boolean;
  tarpRequired?: boolean;
  extraStops?: number;
  fuelSurchargeMentioned?: boolean;
  palletJack?: boolean;
  liftGate?: boolean;
}

function formatMoney(v: number): string {
  return `$${v}`;
}

function buildExtras(opts: ScriptOptions): string {
  const parts: string[] = [];
  if (typeof opts.miles === 'number') parts.push(`${opts.miles} mi`);
  if (opts.isRush) parts.push('rush');
  if (opts.tarpRequired) parts.push('tarp');
  if (typeof opts.extraStops === 'number' && opts.extraStops > 0) {
    parts.push(`${opts.extraStops} extra stop${opts.extraStops > 1 ? 's' : ''}`);
  }
  if (opts.fuelSurchargeMentioned) parts.push('fuel surcharge noted');
  switch (opts.equipment) {
    case 'hotshot':
      parts.push('securement and deadhead');
      break;
    case 'cargo_van':
      parts.push('expedite premium');
      break;
    case 'straight_truck':
      if (opts.palletJack) parts.push('pallet jack');
      if (opts.liftGate) parts.push('lift gate');
      break;
  }
  if (parts.length === 0) return '';
  if (parts.length === 1) return `considering ${parts[0]}`;
  const last = parts.pop();
  return `considering ${parts.join(', ')} and ${last}`;
}

function channelWrap(msg: string, channel: Channel): string {
  switch (channel) {
    case 'email':
      return `Hello,\n\n${msg}\n\nThank you.`;
    case 'phone':
      return `Say: ${msg}`;
    default:
      return msg;
  }
}

function buildMessage(rate: number, stage: 'ask' | 'settle' | 'bottom', opts: ScriptOptions): string {
  const extras = buildExtras(opts);
  const withExtras = extras ? `, ${extras}` : '';
  const money = formatMoney(rate);
  switch (stage) {
    case 'ask': {
      switch (opts.tone) {
        case 'professional':
          return `We can move it for ${money}${withExtras}.`;
        case 'driver':
          return `Looking for ${money}${withExtras}.`;
        case 'firm':
          return `Need ${money}${withExtras}.`;
      }
      break;
    }
    case 'settle': {
      switch (opts.tone) {
        case 'professional':
          return `I can settle at ${money}${withExtras}.`;
        case 'driver':
          return `Can roll for ${money}${withExtras}.`;
        case 'firm':
          return `Can do ${money}${withExtras}.`;
      }
      break;
    }
    case 'bottom': {
      switch (opts.tone) {
        case 'professional':
          return `My bottom line is ${money}${withExtras}.`;
        case 'driver':
          return `Bottom dollar is ${money}${withExtras}.`;
        case 'firm':
          return `Can't go under ${money}${withExtras}.`;
      }
      break;
    }
  }
  return `${money}${withExtras}`;
}

export function generateScripts(options: ScriptOptions): { ask: string; settle: string; bottom: string } {
  return {
    ask: channelWrap(buildMessage(options.ask, 'ask', options), options.channel),
    settle: channelWrap(buildMessage(options.settle, 'settle', options), options.channel),
    bottom: channelWrap(buildMessage(options.bottom, 'bottom', options), options.channel)
  };
}

export default generateScripts;

