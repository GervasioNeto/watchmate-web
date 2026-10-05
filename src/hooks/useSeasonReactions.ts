import { useQuery } from '@tanstack/react-query';
import { seasonQueries } from '@/api/queries';

export function useSeasonReactions(seriesId: string, season: number, enabled = true) {
  return useQuery({
    ...seasonQueries.reactions(seriesId, season),
    enabled: enabled && !!seriesId && season > 0,
  });
}
