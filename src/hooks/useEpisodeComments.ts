import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { episodeQueries, seasonQueries } from '@/api/queries';
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

// Quantos comentários cada episódio da temporada tem: a lista mostra a conversa na linha.
export function useSeasonCommentCounts(seriesId: string, season: number) {
  return useQuery({
    ...seasonQueries.commentCounts(seriesId, season),
    enabled: !!seriesId && season > 0,
  });
}

// Depois de comentar ou apagar: a conversa do episódio e a contagem da temporada.
function useRefreshComments(seriesId: string, season: number, episode: number) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: episodeQueries.comments(seriesId, season, episode).queryKey,
    });
    void queryClient.invalidateQueries({
      queryKey: seasonQueries.commentCounts(seriesId, season).queryKey,
    });
  };
}

export function useAddEpisodeComment(seriesId: string, season: number, episode: number) {
  const refresh = useRefreshComments(seriesId, season, episode);
  return useMutation({
    mutationFn: (texto: string) => episodeService.addComment(seriesId, season, episode, texto),
    onSuccess: refresh,
  });
}

export function useDeleteEpisodeComment(seriesId: string, season: number, episode: number) {
  const refresh = useRefreshComments(seriesId, season, episode);
  return useMutation({
    mutationFn: (commentId: string) =>
      episodeService.deleteComment(seriesId, season, episode, commentId),
    onSuccess: refresh,
  });
}
