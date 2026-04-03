import { useState } from 'react';
import { useDecisionStore, decisionLabels } from '@/store/useDecisionStore';
import { HistorySummaryCard } from './HistorySummaryCard';
import { HistoryFilters } from './HistoryFilters';
import { ExportButton } from './ExportButton';
import { useHistoryFilters } from '@/hooks/useHistoryFilters';
import { EditLoadDialog } from './EditLoadDialog';
import { Pencil, Truck } from 'lucide-react';
import type { LoadEntrySnapshot } from '@/types/mvp';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

const ENTRIES_PER_PAGE = 10;

export function HistoryPanel() {
  const history = useDecisionStore((state) => state.history);
  const clearHistory = useDecisionStore((state) => state.clearHistory);
  const updateDecision = useDecisionStore((state) => state.updateDecision);
  const [displayCount, setDisplayCount] = useState(ENTRIES_PER_PAGE);
  const [editingEntry, setEditingEntry] = useState<LoadEntrySnapshot | null>(null);

  const {
    filtered,
    outcomeFilter,
    setOutcomeFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
  } = useHistoryFilters(history);

  const displayed = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

  if (history.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Decision history</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border bg-background/70 text-center">
          <Truck className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">No loads logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Log your first load to start tracking patterns and insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Decision history</h2>
        <div className="flex items-center gap-2">
          <ExportButton />
          <button
            type="button"
            onClick={clearHistory}
            className="text-sm font-medium text-muted-foreground hover:text-destructive"
          >
            Clear all
          </button>
        </div>
      </div>

      <HistorySummaryCard history={history} />

      <HistoryFilters
        outcomeFilter={outcomeFilter}
        setOutcomeFilter={setOutcomeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background/70 p-4 text-center text-sm text-muted-foreground">
            No results match your filters. Try adjusting your search or filters.
          </p>
        ) : (
          <>
            {displayed.map((entry) => (
              <div key={entry.id} className={`rounded-xl border p-4 shadow-sm ${
                (() => {
                  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                  const isRecent = new Date(entry.createdAt).getTime() > sevenDaysAgo;
                  const isBooked = entry.outcome === 'book';
                  return isRecent && isBooked
                    ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'border-border bg-background';
                })()
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="font-semibold text-foreground">
                    {entry.origin} → {entry.destination}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                        entry.outcome === 'book'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : entry.outcome === 'counter'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      {decisionLabels[entry.outcome]}
                    </span>
                    {entry.outcome === 'counter' && entry.counterResult && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.counterResult === 'accepted'
                            ? 'bg-teal-500/10 text-teal-600'
                            : entry.counterResult === 'declined'
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {entry.counterResult === 'accepted' ? '✓' : entry.counterResult === 'declined' ? '✗' : '⏳'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingEntry(entry)}
                      className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <p>Miles</p>
                    <p className="font-medium text-foreground">{formatNumber(entry.miles)}</p>
                  </div>
                  <div>
                    <p>Net profit</p>
                    <p className="font-medium text-foreground">{formatCurrency(entry.profit)}</p>
                  </div>
                  <div>
                    <p>Net RPM</p>
                    <p className="font-medium text-foreground">{formatNumber(entry.rpm)} /mi</p>
                  </div>
                  <div>
                    <p>Logged</p>
                    <p className="font-medium text-foreground">
                      {new Date(entry.createdAt).toLocaleString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {entry.finalRate && entry.finalRate !== entry.rate && (
                    <div className="col-span-2">
                      <p>Final rate (negotiated)</p>
                      <p className="font-medium text-foreground">{formatCurrency(entry.finalRate)}</p>
                    </div>
                  )}
                </div>
                {entry.notes && <p className="mt-3 text-xs text-muted-foreground">{entry.notes}</p>}
              </div>
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => prev + ENTRIES_PER_PAGE)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
              >
                Load more ({filtered.length - displayCount} remaining)
              </button>
            )}
          </>
        )}
      </div>

      {editingEntry && (
        <EditLoadDialog
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          onSave={(updates) => {
            updateDecision(editingEntry.id, updates);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}
