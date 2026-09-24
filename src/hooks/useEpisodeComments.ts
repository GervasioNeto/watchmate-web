import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EpisodeComment } from '@/types/api';

export function useEpisodeComments(
  seriesId: string,
  season: number,
  episode: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ['series', seriesId, 'season', season, 'episode', episode, 'comments'],
    queryFn: () =>
      api.get<EpisodeComment[]>(
        `/series/${seriesId}/seasons/${season}/episodes/${episode}/comments`,
      ),
    enabled: enabled && !!seriesId && season > 0 && episode > 0,
  });
}

export function useAddEpisodeComment(seriesId: string, season: number, episode: number) {
  const queryClient = useQueryClient();
  const queryKey = ['series', seriesId, 'season', season, 'episode', episode, 'comments'];

  return useMutation({
    mutationFn: (texto: string) =>
      api.post<EpisodeComment>(
        `/series/${seriesId}/seasons/${season}/episodes/${episode}/comments`,
        { texto },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteEpisodeComment(seriesId: string, season: number, episode: number) {
  const queryClient = useQueryClient();
  const queryKey = ['series', seriesId, 'season', season, 'episode', episode, 'comments'];

  return useMutation({
    mutationFn: (commentId: string) =>
      api.delete(
        `/series/${seriesId}/seasons/${season}/episodes/${episode}/comments/${commentId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
