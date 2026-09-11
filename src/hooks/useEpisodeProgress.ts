import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EpisodeProgress } from '@/types/api';

export function useEpisodeProgress(seriesId: string) {
  return useQuery({
    queryKey: ['series', seriesId, 'progress'],
    queryFn: () => api.get<EpisodeProgress[]>(`/series/${seriesId}/progress`),
    enabled: !!seriesId,
  });
}

interface MarkEpisodeInput {
  season: number;
  episode: number;
  watched: boolean;
}

export function useMarkEpisode(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ season, episode, watched }: MarkEpisodeInput) =>
      api.put<EpisodeProgress>(
        `/series/${seriesId}/seasons/${season}/episodes/${episode}`,
        { watched },
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData<EpisodeProgress[]>(['series', seriesId, 'progress'], (old) => {
        if (!old) return [updated];
        const index = old.findIndex(
          (entry) => entry.temporada === updated.temporada && entry.episodio === updated.episodio,
        );
        if (index === -1) return [...old, updated];
        const next = [...old];
        next[index] = updated;
        return next;
      });
    },
  });
}
