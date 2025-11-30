import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getAffiliateOffers, handleAffiliateClick } from '@/services/affiliateService';
import type { AffiliateOffer, AffiliateContext } from '@/types/affiliate';
import { trackAffiliateView } from '@/utils/analytics';

interface AffiliatePanelProps {
  context: AffiliateContext;
  maxOffers?: number;
  className?: string;
}

const categoryIcons: Record<string, string> = {
  factoring: '💵',
  fuel_card: '⛽',
  load_board: '📋',
  insurance: '🛡️',
  tax_software: '📊',
};

export function AffiliatePanel({ context, maxOffers = 3, className = '' }: AffiliatePanelProps) {
  const [offers, setOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    async function loadOffers() {
      setLoading(true);
      const result = await getAffiliateOffers(context);
      if (!cancelled) {
        const limitedOffers = result.slice(0, maxOffers);
        setOffers(limitedOffers);
        setLoading(false);
        
        // Track view
        if (limitedOffers.length > 0) {
          trackAffiliateView(context.screen, limitedOffers.length);
        }
      }
    }
    
    loadOffers();
    return () => { cancelled = true; };
  }, [context.screen, context.equipmentType, context.rpm, context.hasOfferHistory, maxOffers]);

  if (loading || offers.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tools for truckers
      </p>
      <div className="space-y-2">
        {offers.map((offer) => (
          <button
            key={offer.id}
            onClick={() => handleAffiliateClick(offer, context)}
            className="w-full text-left rounded-lg border border-border bg-background p-3 transition hover:bg-muted/50 hover:border-primary/30 group"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{categoryIcons[offer.category] || '🔗'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground group-hover:text-primary">
                    {offer.name}
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {offer.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/60 text-center">
        Partner recommendations
      </p>
    </div>
  );
}
