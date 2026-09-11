import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TrackedSeries } from '@/types/api';

export function useSeries() {
  return useQuery({
    queryKey: ['series'],
    queryFn: () => api.get<TrackedSeries[]>('/series'),
  });
}

export function useAddSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tmdbId: number) => api.post<TrackedSeries>('/series', { tmdbId }),
    onSuccess: (series) => {
      queryClient.setQueryData<TrackedSeries[]>(['series'], (old) =>
        old ? [series, ...old] : [series],
      );
    },
  });
}
