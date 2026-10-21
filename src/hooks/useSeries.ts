import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seriesQueries } from '@/api/queries';
import { queryKeys } from '@/api/queryKeys';
import { seriesService } from '@/api/services/seriesService';

export function useSeries() {
  return useQuery(seriesQueries.list());
}

export function useAddSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seriesService.add,
    onSuccess: (series) => {
      queryClient.setQueryData(seriesQueries.list().queryKey, (old) =>
        old ? [series, ...old] : [series],
      );
      // As sugestões "Para vocês dois" saem da lista: com uma série nova, mudam.
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.forUs() });
    },
  });
}

// "Quero ver" é otimista: o coração muda no toque. Os toques na mesma série saem em fila
// (scope), então a última resposta é sempre a do último toque. Se der erro, a lista é
// buscada de novo para mostrar o que vale de verdade.
export function useSetInterest(seriesId: string, meId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = seriesQueries.list();

  const setInterested = (update: (ids: string[]) => string[]) =>
    queryClient.setQueryData(queryKey, (old) =>
      old?.map((item) =>
        item.id === seriesId ? { ...item, interessados: update(item.interessados) } : item,
      ),
    );

  return useMutation({
    scope: { id: `interest:${seriesId}` },
    mutationFn: (wants: boolean) => seriesService.setInterest(seriesId, wants),
    onMutate: async (wants) => {
      await queryClient.cancelQueries({ queryKey });
      setInterested((ids) => {
        const others = ids.filter((id) => id !== meId);
        return wants ? [...others, meId] : others;
      });
    },
    onSuccess: ({ interessados }) => setInterested(() => interessados),
    onError: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seriesService.remove,
    onSuccess: (_data, seriesId) => {
      queryClient.setQueryData(seriesQueries.list().queryKey, (old) =>
        old?.filter((item) => item.id !== seriesId),
      );
    },
  });
}
