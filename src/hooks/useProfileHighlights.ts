import { useCouple } from '@/hooks/useCouple';
import { useListEntries } from '@/hooks/useListEntries';
import { computeProfileHighlights, type ProfileHighlights } from '@/lib/profileHighlights';

// Os seus números, a partir do progresso que a lista já carrega (o mesmo cache). `null`
// enquanto alguma série carrega, para não mostrar um total pela metade.
export function useProfileHighlights(): ProfileHighlights | null {
  const { me, partner } = useCouple();
  const { entries, isSeriesLoading, isProgressLoading } = useListEntries();
  if (!me || isSeriesLoading || isProgressLoading) return null;
  return computeProfileHighlights(entries, me.id, partner?.id ?? null);
}
