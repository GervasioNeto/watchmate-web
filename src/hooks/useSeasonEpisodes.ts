import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SeasonEpisode } from '@/types/api';

export function useSeasonEpisodes(seriesId: string, season: number) {
  return useQuery({
    queryKey: ['series', seriesId, 'season', season, 'episodes'],
    queryFn: () => api.get<SeasonEpisode[]>(`/series/${seriesId}/seasons/${season}/episodes`),
    enabled: !!seriesId && season > 0,
  });
}
