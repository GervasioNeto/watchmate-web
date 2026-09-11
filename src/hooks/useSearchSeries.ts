import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SeriesSearchResult } from '@/types/api';

export function useSearchSeries(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['series-search', trimmed],
    queryFn: () => api.get<SeriesSearchResult[]>(`/series/search?q=${encodeURIComponent(trimmed)}`),
    enabled: trimmed.length > 0,
  });
}
