import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { episodeQueries } from '@/api/queries';
import { episodeService } from '@/api/services/episodeService';
import type { EpisodeReaction, EpisodeUser } from '@/types/api';

export function useEpisodeReactions(
  seriesId: string,
  season: number,
  episode: number,
  enabled = true,
) {
  return useQuery({
    ...episodeQueries.reactions(seriesId, season, episode),
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
  const { queryKey } = episodeQueries.reactions(seriesId, season, episode);

  return useMutation({
    mutationFn: (emoji: string) => episodeService.setReaction(seriesId, season, episode, emoji),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      if (currentUser) {
        queryClient.setQueryData(queryKey, (old) => {
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
