import { useQuery } from '@tanstack/react-query';
import { seasonQueries } from '@/api/queries';

export function useSeasonEpisodes(seriesId: string, season: number) {
  return useQuery({
    ...seasonQueries.episodes(seriesId, season),
    enabled: !!seriesId && season > 0,
  });
}
