import { describe, expect, it } from 'vitest';
import { defaultCompensationProfile } from '@/types/compensation';
import { getProfileCompensationDecision } from './profileDecision';
const targets = { targetLoadedMileRate:.85, minimumLoadedMileRate:.70, targetDeadheadRate:.5, minimumDeadheadRate:.25, targetFlatPay:850, minimumFlatPay:700, targetPercentage:45, minimumPercentage:40 };
describe('profile decision thresholds', () => {
 it('books at target',()=>expect(getProfileCompensationDecision({...defaultCompensationProfile,type:'per_mile',perLoadedMile:.85},targets)?.level).toBe('book'));
 it('counters between minimum and target',()=>expect(getProfileCompensationDecision({...defaultCompensationProfile,type:'per_mile',perLoadedMile:.75},targets)?.level).toBe('counter'));
 it('passes below minimum',()=>expect(getProfileCompensationDecision({...defaultCompensationProfile,type:'flat',flatRate:650},targets)?.level).toBe('pass'));
 it('falls back when boundaries are not configured',()=>expect(getProfileCompensationDecision({...defaultCompensationProfile,type:'percentage',percentage:40},{...targets,targetPercentage:0}) ).toBeNull());
});
