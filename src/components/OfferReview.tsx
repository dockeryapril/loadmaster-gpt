import type { LoadFormInput } from '@/types/mvp';
import type { UnifiedOffer, OfferField } from '@/utils/reconcileOfferSources';

const labels: Record<OfferField, string> = {
  origin: 'Origin',
  destination: 'Destination',
  miles: 'Loaded miles',
  deadheadMiles: 'Deadhead',
  rate: 'Rate',
  fsc: 'FSC',
  tolls: 'Tolls',
};

interface OfferReviewProps {
  offer: UnifiedOffer;
  onApply: (data: Partial<LoadFormInput>) => void;
  onCancel: () => void;
}

export function OfferReview({ offer, onApply, onCancel }: OfferReviewProps) {
  const conflicts = Object.entries(offer.conflicts).filter(([, values]) => values?.length);
  const hasConflicts = conflicts.length > 0;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Review extracted offer</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Load Master combined your available sources. Verify before applying.
          </p>
        </div>
        {hasConflicts && (
          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold uppercase text-amber-700">
            Review needed
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {(Object.entries(offer.values) as Array<[OfferField, string]>).map(([field, value]) => (
          <div key={field} className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-xs text-muted-foreground">{labels[field]}</p>
              <p className="text-sm font-medium">{field === 'rate' || field === 'fsc' || field === 'tolls' ? '$' : ''}{value}</p>
            </div>
            <p className="max-w-[45%] text-right text-[10px] text-muted-foreground">
              {offer.sources[field]?.join(' + ')}
            </p>
          </div>
        ))}
      </div>

      {hasConflicts && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold text-amber-700">Conflicting information</p>
          {conflicts.map(([field, values]) => (
            <div key={field} className="mt-2 text-xs">
              <span className="font-medium">{labels[field as OfferField]}: </span>
              <span className="text-muted-foreground">
                {values?.map((item) => `${item.value} — ${item.source}`).join(' vs ')}
              </span>
            </div>
          ))}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Conflicting fields are not auto-filled. Correct them manually before calculating.
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onApply(offer.values as Partial<LoadFormInput>)}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply verified fields
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}
