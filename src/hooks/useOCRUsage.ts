import { useState, useEffect } from 'react';
import { useTierDetection } from './useTierDetection';

export interface OCRUsageInfo {
  daily: number;
  dailyLimit: number;
  remaining: number;
  canUseOCR: boolean;
  resetTime: Date;
}

export function useOCRUsage(): OCRUsageInfo {
  const { isPro } = useTierDetection();
  const [dailyUsage, setDailyUsage] = useState(0);

  // Define limits based on tier
  const dailyLimit = isPro ? 100 : 5;

  // Get today's date key for localStorage
  const today = new Date().toDateString();
  const storageKey = `ocr_usage_${today}`;

  useEffect(() => {
    // Load today's usage from localStorage
    const savedUsage = localStorage.getItem(storageKey);
    setDailyUsage(savedUsage ? parseInt(savedUsage, 10) : 0);

    // Clean up old usage entries
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ocr_usage_') && key !== storageKey) {
        localStorage.removeItem(key);
      }
    });
  }, [storageKey]);

  // Calculate reset time (midnight tonight)
  const resetTime = new Date();
  resetTime.setDate(resetTime.getDate() + 1);
  resetTime.setHours(0, 0, 0, 0);

  const remaining = Math.max(0, dailyLimit - dailyUsage);
  const canUseOCR = remaining > 0;

  return {
    daily: dailyUsage,
    dailyLimit,
    remaining,
    canUseOCR,
    resetTime
  };
}

export function incrementOCRUsage(): void {
  const today = new Date().toDateString();
  const storageKey = `ocr_usage_${today}`;
  const currentUsage = parseInt(localStorage.getItem(storageKey) || '0', 10);
  localStorage.setItem(storageKey, (currentUsage + 1).toString());
}