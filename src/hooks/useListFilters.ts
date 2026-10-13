import { useSearchParams } from 'react-router-dom';
import type { KindFilter, ProgressFilter, SeriesKind } from '@/lib/seriesFilters';

// Os filtros da lista ficam na URL (/my-list?progresso=assistindo&tipo=animes): sobrevivem
// a recarregar a página, a abrir uma série e voltar, e dá para mandar o link filtrado.
const PROGRESS_PARAM = 'progresso';
const KIND_PARAM = 'tipo';

const PROGRESS_SLUGS: Record<Exclude<ProgressFilter, 'all'>, string> = {
  watching: 'assistindo',
  'not-started': 'para-comecar',
  finished: 'assistidas',
  'partner-ahead': 'a-frente',
};

const KIND_SLUGS: Record<SeriesKind, string> = {
  series: 'series',
  anime: 'animes',
  animation: 'animacoes',
};

// Valor desconhecido na URL (link antigo, digitado à mão) volta para "all".
function fromSlug<T extends string>(slugs: Record<T, string>, slug: string | null): T | 'all' {
  const match = (Object.entries(slugs) as Array<[T, string]>).find(([, value]) => value === slug);
  return match ? match[0] : 'all';
}

export function useListFilters() {
  const [params, setParams] = useSearchParams();

  const progress: ProgressFilter = fromSlug(PROGRESS_SLUGS, params.get(PROGRESS_PARAM));
  const kind: KindFilter = fromSlug(KIND_SLUGS, params.get(KIND_PARAM));

  // `replace`: trocar de filtro não cria uma entrada nova no histórico do navegador.
  function update(key: string, slug: string | null) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (slug) next.set(key, slug);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  return {
    progress,
    kind,
    isFiltered: progress !== 'all' || kind !== 'all',
    setProgress: (filter: ProgressFilter) =>
      update(PROGRESS_PARAM, filter === 'all' ? null : PROGRESS_SLUGS[filter]),
    setKind: (filter: KindFilter) =>
      update(KIND_PARAM, filter === 'all' ? null : KIND_SLUGS[filter]),
    clear: () => {
      update(PROGRESS_PARAM, null);
      update(KIND_PARAM, null);
    },
  };
}
