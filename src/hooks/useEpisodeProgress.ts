import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { seriesQueries } from '@/api/queries';
import { progressService } from '@/api/services/progressService';

export function useEpisodeProgress(seriesId: string) {
  return useQuery({
    ...seriesQueries.progress(seriesId),
    enabled: !!seriesId,
  });
}

export function useEpisodeProgressForSeries(seriesIds: string[]) {
  return useQueries({
    queries: seriesIds.map((seriesId) => ({
      ...seriesQueries.progress(seriesId),
      enabled: !!seriesId,
    })),
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
      progressService.markEpisode(seriesId, season, episode, watched),
    onSuccess: (updated) => {
      queryClient.setQueryData(seriesQueries.progress(seriesId).queryKey, (old) => {
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

export function useMarkSeasonWatched(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ season, watched }: { season: number; watched: boolean }) =>
      progressService.markSeason(seriesId, season, watched),
    onSuccess: (seasonProgress, variables) => {
      queryClient.setQueryData(seriesQueries.progress(seriesId).queryKey, (old) => {
        const others = (old ?? []).filter((entry) => entry.temporada !== variables.season);
        return [...others, ...seasonProgress];
      });
    },
  });
}
