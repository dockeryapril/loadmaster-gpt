import { useMemo, useState } from 'react';
import type { LoadEntrySnapshot, DecisionOutcome } from '@/types/mvp';

type SortOption = 'newest' | 'profit-high' | 'profit-low' | 'rpm-high' | 'rpm-low';

export function useHistoryFilters(history: LoadEntrySnapshot[]) {
  const [outcomeFilter, setOutcomeFilter] = useState<DecisionOutcome | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = [...history];

    // Apply outcome filter
    if (outcomeFilter !== 'all') {
      result = result.filter((entry) => entry.outcome === outcomeFilter);
    }

    // Apply search filter (case-insensitive across origin/destination)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (entry) =>
          entry.origin.toLowerCase().includes(query) ||
          entry.destination.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'profit-high':
        result.sort((a, b) => b.profit - a.profit);
        break;
      case 'profit-low':
        result.sort((a, b) => a.profit - b.profit);
        break;
      case 'rpm-high':
        result.sort((a, b) => b.rpm - a.rpm);
        break;
      case 'rpm-low':
        result.sort((a, b) => a.rpm - b.rpm);
        break;
    }

    return result;
  }, [history, outcomeFilter, sortBy, searchQuery]);

  return {
    filtered,
    outcomeFilter,
    setOutcomeFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
  };
}
