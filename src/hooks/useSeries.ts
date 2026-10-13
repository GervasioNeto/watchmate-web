import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seriesQueries } from '@/api/queries';
import { seriesService } from '@/api/services/seriesService';
import type { WatchMode } from '@/types/api';

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
    },
  });
}

// O modo aparece em dois caches: na lista de séries e no resumo de progresso.
export function useUpdateWatchMode(seriesId: string) {
  const queryClient = useQueryClient();
  const listKey = seriesQueries.list().queryKey;
  const progressKey = seriesQueries.progress(seriesId).queryKey;

  function applyMode(modo: WatchMode) {
    queryClient.setQueryData(listKey, (old) =>
      old?.map((item) => (item.id === seriesId ? { ...item, modo } : item)),
    );
    queryClient.setQueryData(progressKey, (old) => (old ? { ...old, modo } : old));
  }

  return useMutation({
    mutationFn: (modo: WatchMode) => seriesService.updateMode(seriesId, modo),
    onMutate: async (modo) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: progressKey }),
      ]);
      const previous = queryClient
        .getQueryData(listKey)
        ?.find((item) => item.id === seriesId)?.modo;
      applyMode(modo);
      return { previous };
    },
    onError: (_err, _modo, context) => {
      if (context?.previous) applyMode(context.previous);
    },
    onSuccess: (series) => applyMode(series.modo),
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
