import { describe, it, expect } from 'vitest';
import generateScripts from '@/features/negotiation/templates';

describe('generateScripts', () => {
  it('inserts provided fields into scripts', () => {
    const scripts = generateScripts({
      ask: 1200,
      settle: 1100,
      bottom: 1000,
      channel: 'text',
      tone: 'professional',
      equipment: 'hotshot',
      miles: 200,
      isRush: true,
    });

    expect(scripts.ask).toContain('$1200');
    expect(scripts.ask).toContain('200 mi');
    expect(scripts.ask).toContain('rush');
  });

  it('applies equipment-specific phrases like deadhead for hotshot loads', () => {
    const scripts = generateScripts({
      ask: 1000,
      settle: 900,
      bottom: 800,
      channel: 'text',
      tone: 'professional',
      equipment: 'hotshot',
      miles: 250,
    });

    expect(scripts.ask).toContain('deadhead');
  });

  it('omits phrases when optional fields are undefined', () => {
    const scripts = generateScripts({
      ask: 1000,
      settle: 900,
      bottom: 800,
      channel: 'text',
      tone: 'professional',
      equipment: 'straight_truck',
    });

    expect(scripts.ask).toBe('We can move it for $1000.');
  });
});

