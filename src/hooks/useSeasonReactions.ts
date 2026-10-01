import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SeasonReaction } from '@/types/api';

export function useSeasonReactions(seriesId: string, season: number, enabled = true) {
  return useQuery({
    queryKey: ['series', seriesId, 'season', season, 'all-reactions'],
    queryFn: () =>
      api.get<SeasonReaction[]>(`/series/${seriesId}/seasons/${season}/reactions`),
    enabled: enabled && !!seriesId && season > 0,
  });
}
