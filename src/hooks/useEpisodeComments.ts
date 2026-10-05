import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { episodeQueries } from '@/api/queries';
import { episodeService } from '@/api/services/episodeService';

export function useEpisodeComments(
  seriesId: string,
  season: number,
  episode: number,
  enabled = true,
) {
  return useQuery({
    ...episodeQueries.comments(seriesId, season, episode),
    enabled: enabled && !!seriesId && season > 0 && episode > 0,
  });
}

export function useAddEpisodeComment(seriesId: string, season: number, episode: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (texto: string) => episodeService.addComment(seriesId, season, episode, texto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: episodeQueries.comments(seriesId, season, episode).queryKey,
      });
    },
  });
}

export function useDeleteEpisodeComment(seriesId: string, season: number, episode: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      episodeService.deleteComment(seriesId, season, episode, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: episodeQueries.comments(seriesId, season, episode).queryKey,
      });
    },
  });
}
