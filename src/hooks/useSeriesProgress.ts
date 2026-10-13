import {
  useMutation,
  useMutationState,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { seriesQueries } from '@/api/queries';
import { isSpoilerSensitiveKey, mutationKeys } from '@/api/queryKeys';
import {
  progressService,
  type MarkEpisodeInput,
  type MarkSeasonInput,
} from '@/api/services/progressService';

export function useSeriesProgress(seriesId: string) {
  return useQuery({
    ...seriesQueries.progress(seriesId),
    enabled: !!seriesId,
  });
}

export function useSeriesProgressList(seriesIds: string[]) {
  return useQueries({
    queries: seriesIds.map((seriesId) => ({
      ...seriesQueries.progress(seriesId),
      enabled: !!seriesId,
    })),
  });
}

export type ProgressAction =
  | ({ kind: 'episode' } & MarkEpisodeInput)
  | ({ kind: 'season' } & MarkSeasonInput)
  | { kind: 'catch-up' };

function runProgressAction(seriesId: string, action: ProgressAction) {
  switch (action.kind) {
    case 'episode':
      return progressService.markEpisode(seriesId, action);
    case 'season':
      return progressService.markSeason(seriesId, action);
    case 'catch-up':
      return progressService.catchUp(seriesId);
  }
}

// Séries que tiveram mais de uma ação de progresso em andamento ao mesmo tempo.
// Nesse caso a ordem das respostas não garante qual resumo é o mais novo, então o
// resumo é buscado de novo quando a última delas terminar.
const seriesWithOverlappingActions = new Set<string>();

export function useUpdateProgress(seriesId: string) {
  const queryClient = useQueryClient();
  const mutationKey = mutationKeys.progress(seriesId);

  return useMutation({
    mutationKey,
    mutationFn: (action: ProgressAction) => runProgressAction(seriesId, action),
    onSettled: async (summary, error) => {
      // Durante o onSettled a própria mutation ainda conta como em andamento.
      if (queryClient.isMutating({ mutationKey }) > 1) {
        seriesWithOverlappingActions.add(seriesId);
        return;
      }

      // Episódios recém-vistos podem revelar reações e comentários do parceiro.
      void queryClient.invalidateQueries({
        predicate: (query) => isSpoilerSensitiveKey(seriesId)(query.queryKey),
      });

      const { queryKey } = seriesQueries.progress(seriesId);
      const overlapped = seriesWithOverlappingActions.delete(seriesId);
      if (overlapped || error || !summary) {
        await queryClient.invalidateQueries({ queryKey });
      } else {
        queryClient.setQueryData(queryKey, summary);
      }
    },
  });
}

// Se alguma ação pendente pode mudar esse episódio (ele mesmo, a temporada inteira
// ou um "alcancei").
export function affectsEpisode(action: ProgressAction, season: number, episode: number): boolean {
  if (action.kind === 'catch-up') return true;
  if (action.kind === 'season') return action.season === season;
  return action.season === season && action.episode === episode;
}

// Ações de progresso ainda em andamento nessa série, de qualquer componente.
export function usePendingProgressActions(seriesId: string): ProgressAction[] {
  return useMutationState({
    filters: { mutationKey: mutationKeys.progress(seriesId), status: 'pending' },
    select: (mutation) => mutation.state.variables as ProgressAction,
  });
}
