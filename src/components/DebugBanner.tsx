import { getTier, getTierDisplay } from '@/utils/tier';
import { isDebugMode } from '@/utils/debug';

export function DebugBanner() {
  if (!isDebugMode()) {
    return null;
  }

  const tier = getTier();
  const displayTier = getTierDisplay();

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-sm px-4 py-1 z-50 text-center">
      <strong>DEBUG MODE:</strong> Tier: {displayTier} (normalized: {tier})
    </div>
  );
}