import { Search } from 'lucide-react';
import type { DecisionOutcome } from '@/types/mvp';

type SortOption = 'newest' | 'profit-high' | 'profit-low' | 'rpm-high' | 'rpm-low';

interface HistoryFiltersProps {
  outcomeFilter: DecisionOutcome | 'all';
  setOutcomeFilter: (filter: DecisionOutcome | 'all') => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const outcomeOptions: Array<{ value: DecisionOutcome | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'book', label: 'Booked' },
  { value: 'counter', label: 'Countered' },
  { value: 'pass', label: 'Passed' },
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'profit-high', label: 'Highest profit' },
  { value: 'profit-low', label: 'Lowest profit' },
  { value: 'rpm-high', label: 'Best RPM' },
  { value: 'rpm-low', label: 'Worst RPM' },
];

export function HistoryFilters({
  outcomeFilter,
  setOutcomeFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
}: HistoryFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search origin or destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* Filter and Sort */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Filter by outcome</label>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as DecisionOutcome | 'all')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {outcomeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
