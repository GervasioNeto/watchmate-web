import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { discoverQueries } from '@/api/queries';
import { useSeries } from '@/hooks/useSeries';
import type { DiscoverOrigin } from '@/types/api';

// Trocar de origem mantém a estante anterior na tela até a nova chegar, em vez de piscar
// os esqueletos.
export function useTrending(origin: DiscoverOrigin) {
  return useQuery({ ...discoverQueries.trending(origin), placeholderData: keepPreviousData });
}

export function useOnTheAir(origin: DiscoverOrigin) {
  return useQuery({ ...discoverQueries.onTheAir(origin), placeholderData: keepPreviousData });
}

export function useCoupleSuggestions() {
  return useQuery(discoverQueries.forUs());
}

export function useCommunitySeries() {
  return useQuery(discoverQueries.community());
}

// A prévia da série aberta na folha; nada é buscado enquanto ela está fechada.
export function useSeriesPreview(tmdbId: number | null) {
  return useQuery({ ...discoverQueries.preview(tmdbId ?? 0), enabled: tmdbId !== null });
}

// As séries que já estão na lista da dupla, pelo id do TMDB: dá o "Na lista" nos pôsteres e
// leva à série certa ao abrir.
export function useTrackedSeriesByTmdbId(): Map<number, string> {
  const { data } = useSeries();
  return useMemo(() => new Map(data?.map((series) => [series.tmdbId, series.id])), [data]);
}

const ORIGIN_KEY = 'watchmate:explorar-origem';
const ORIGINS: readonly DiscoverOrigin[] = ['all', 'th', 'kr', 'jp', 'anime'];

function readOrigin(): DiscoverOrigin {
  try {
    const saved = localStorage.getItem(ORIGIN_KEY);
    return ORIGINS.find((origin) => origin === saved) ?? 'all';
  } catch {
    return 'all';
  }
}

// A origem escolhida no "Explorar" fica guardada neste aparelho: quem vê série tailandesa
// abre a busca já nas tailandesas.
export function useExploreOrigin() {
  const [origin, setOrigin] = useState<DiscoverOrigin>(readOrigin);

  function choose(next: DiscoverOrigin) {
    setOrigin(next);
    try {
      localStorage.setItem(ORIGIN_KEY, next);
    } catch {
      // Sem armazenamento (aba anônima): só não lembra.
    }
  }

  return [origin, choose] as const;
}
