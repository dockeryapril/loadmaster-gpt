import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

await register(new URL('../ts-loader.js', import.meta.url));
const { computeNegotiation, DEFAULT_NEGOTIATION_SETTINGS } = await import('../src/index.ts');

test('computeNegotiation calculates rates with baseline RPM', () => {
  const load = { miles: 100, rate: 1000 };
  const userSettings = {
    rpmThresholds: { excellent: 2, good: 1.5, fair: 1 }
  };
  const negotiationSettings = {
    ...DEFAULT_NEGOTIATION_SETTINGS,
    rush_enabled: false,
    weekend_enabled: false,
    heavy_enabled: false,
    multi_stop_enabled: false,
    premium_freight_enabled: false,
    anchor_offset: 0.2,
    floor_offset: 0.1
  };
  const result = computeNegotiation(load, userSettings, negotiationSettings, 2.5);
  assert.ok(result);
  assert.strictEqual(result.anchor_rate, 300);
  assert.strictEqual(result.target_rate, 250);
  assert.strictEqual(result.floor_rate, 225);
  assert.strictEqual(result.base_rpm, 2.5);
  assert.deepStrictEqual(result.premiums_applied, []);
  assert.strictEqual(result.suggested_strategy, 'standard');
});

test('computeNegotiation returns null when miles or rate missing', () => {
  const load = { miles: 0, rate: 0 };
  const userSettings = {
    rpmThresholds: { excellent: 2, good: 1.5, fair: 1 }
  };
  const negotiationSettings = { ...DEFAULT_NEGOTIATION_SETTINGS };
  const result = computeNegotiation(load, userSettings, negotiationSettings);
  assert.strictEqual(result, null);
});
