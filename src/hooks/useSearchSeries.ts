import { useQuery } from '@tanstack/react-query';
import { seriesQueries } from '@/api/queries';

export function useSearchSeries(query: string) {
  const trimmed = query.trim();
  return useQuery({
    ...seriesQueries.search(trimmed),
    enabled: trimmed.length > 0,
  });
}
