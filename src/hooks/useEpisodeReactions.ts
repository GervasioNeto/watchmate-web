import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { episodeQueries, seasonQueries } from '@/api/queries';
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
          const now = new Date().toISOString();
          const existing = list.find((entry) => entry.usuarioId === currentUser.id);
          const optimistic: EpisodeReaction = {
            id: existing?.id ?? `optimistic-${currentUser.id}`,
            serieAcompanhadaId: seriesId,
            temporada: season,
            episodio: episode,
            usuarioId: currentUser.id,
            usuario: currentUser,
            criadoEm: existing?.criadoEm ?? now,
            atualizadoEm: now,
            oculto: false,
            emoji,
          };
          return existing
            ? list.map((entry) => (entry === existing ? optimistic : entry))
            : [...list, optimistic];
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
      // A retrospectiva da temporada é montada a partir dessas reações.
      queryClient.invalidateQueries({
        queryKey: seasonQueries.reactions(seriesId, season).queryKey,
      });
    },
  });
}
