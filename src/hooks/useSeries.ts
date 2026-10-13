import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seriesQueries } from '@/api/queries';
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
    },
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
