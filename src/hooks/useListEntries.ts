import { useSeries } from '@/hooks/useSeries';
import { useSeriesProgressList } from '@/hooks/useSeriesProgress';
import type { ListEntry } from '@/lib/seriesFilters';

// As séries da dupla com o progresso de cada uma. O progresso chega série a série (uma
// busca por série), então `progress` fica ausente até a daquela série chegar. Lista,
// página da dupla e placar leem daqui: o cache é o mesmo e nada é buscado duas vezes.
export function useListEntries() {
  const { data: series, isLoading: isSeriesLoading } = useSeries();
  const progressQueries = useSeriesProgressList((series ?? []).map((item) => item.id));

  const entries: ListEntry[] = (series ?? []).map((item, index) => ({
    series: item,
    progress: progressQueries[index]?.data,
  }));

  return {
    entries,
    isSeriesLoading,
    isProgressLoading: progressQueries.some((query) => query.isPending),
  };
}
