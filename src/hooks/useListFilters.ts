import { useSearchParams } from 'react-router-dom';
import type { KindFilter, ProgressFilter, SeriesKind } from '@/lib/seriesFilters';

// O estado da lista fica na URL (/my-list?progresso=assistindo&tipo=animes&assistidas=abertas):
// sobrevive a recarregar a página, a abrir uma série e voltar, e dá para mandar o link.
const PROGRESS_PARAM = 'progresso';
const KIND_PARAM = 'tipo';
const ARCHIVE_PARAM = 'assistidas';
const ARCHIVE_OPEN = 'abertas';

const PROGRESS_SLUGS: Record<Exclude<ProgressFilter, 'all'>, string> = {
  watching: 'assistindo',
  'not-started': 'para-comecar',
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
  const isArchiveOpen = params.get(ARCHIVE_PARAM) === ARCHIVE_OPEN;

  // Toda mudança passa por uma única atualização. Chamar setParams duas vezes seguidas
  // perde a primeira: a forma de função parte dos parâmetros da renderização atual.
  // `replace`: mexer nos filtros não cria entradas novas no histórico do navegador.
  // `preventScrollReset`: e não é ir para outra página, então a tela fica onde está (o
  // ScrollRestoration do RootLayout levaria a página para o topo).
  function update(changes: Record<string, string | null>) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  return {
    progress,
    kind,
    isArchiveOpen,
    isFiltered: progress !== 'all' || kind !== 'all',
    setProgress: (filter: ProgressFilter) =>
      update({ [PROGRESS_PARAM]: filter === 'all' ? null : PROGRESS_SLUGS[filter] }),
    setKind: (filter: KindFilter) =>
      update({ [KIND_PARAM]: filter === 'all' ? null : KIND_SLUGS[filter] }),
    setArchiveOpen: (open: boolean) => update({ [ARCHIVE_PARAM]: open ? ARCHIVE_OPEN : null }),
    clearFilters: () => update({ [PROGRESS_PARAM]: null, [KIND_PARAM]: null }),
  };
}
