import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EpisodeReaction, EpisodeUser } from '@/types/api';

export function useEpisodeReactions(
  seriesId: string,
  season: number,
  episode: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ['series', seriesId, 'season', season, 'episode', episode, 'reactions'],
    queryFn: () =>
      api.get<EpisodeReaction[]>(
        `/series/${seriesId}/seasons/${season}/episodes/${episode}/reactions`,
      ),
    enabled: enabled && !!seriesId && season > 0 && episode > 0,
  });
}

export function useSetEpisodeReaction(
  seriesId: string,
  season: number,
  episode: number,
  currentUser: EpisodeUser | undefined,
) {
  const queryClient = useQueryClient();
  const queryKey = ['series', seriesId, 'season', season, 'episode', episode, 'reactions'];

  return useMutation({
    mutationFn: (emoji: string) =>
      api.put<EpisodeReaction>(
        `/series/${seriesId}/seasons/${season}/episodes/${episode}/reaction`,
        { emoji },
      ),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EpisodeReaction[]>(queryKey);

      if (currentUser) {
        queryClient.setQueryData<EpisodeReaction[]>(queryKey, (old) => {
          const list = old ?? [];
          const optimistic: EpisodeReaction = {
            emoji,
            usuario: currentUser,
            atualizadoEm: new Date().toISOString(),
          };
          const index = list.findIndex((entry) => entry.usuario.id === currentUser.id);
          if (index === -1) return [...list, optimistic];
          const next = [...list];
          next[index] = optimistic;
          return next;
        });
      }

      return { previous };
    },
    onError: (_err, _emoji, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
