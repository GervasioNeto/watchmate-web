import { useCouple } from '@/hooks/useCouple';
import { useSeries } from '@/hooks/useSeries';
import { useSeriesProgressList } from '@/hooks/useSeriesProgress';
import { computeCoupleStats, type CoupleStats } from '@/lib/coupleStats';

// Números da dupla a partir do progresso de todas as séries (o mesmo cache da lista).
// `null` enquanto alguma série ainda está carregando, para não mostrar um total parcial.
// Uma série que falhou ao carregar fica de fora em vez de travar o resto.
export function useCoupleStats(): CoupleStats | null {
  const { me, partner } = useCouple();
  const { data: series } = useSeries();
  const progressQueries = useSeriesProgressList((series ?? []).map((item) => item.id));

  if (!me || !series) return null;
  if (progressQueries.some((query) => query.isPending)) return null;

  const stats = computeCoupleStats(
    progressQueries.flatMap((query) => (query.data ? [query.data] : [])),
    me.id,
    partner?.id ?? null,
  );
  return { ...stats, seriesCount: series.length };
}
