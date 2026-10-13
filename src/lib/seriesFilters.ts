import type { SeriesProgress, TrackedSeries } from '@/types/api';

// Filtro principal: entre as séries em aberto, onde o casal está. As séries que vocês
// já terminaram não passam por esse filtro: ficam na seção "Assistidas" (ver splitEntries).
export type ProgressFilter = 'all' | 'watching' | 'not-started' | 'partner-ahead';

// Filtro secundário: o tipo da série. Vale tanto para as em aberto quanto para as assistidas.
export type SeriesKind = 'series' | 'anime' | 'animation';
export type KindFilter = 'all' | SeriesKind;

export interface ListEntry {
  series: TrackedSeries;
  // Ausente enquanto o progresso daquela série ainda carrega.
  progress: SeriesProgress | undefined;
}

export interface FilterContext {
  meId: string;
  partnerId: string | null;
}

// O TMDB devolve os gêneros no idioma pedido (pt-BR), mas às vezes cai no inglês.
const ANIMATION_GENRES = new Set(['Animação', 'Animation']);

// Anime = animação de origem japonesa; o resto da animação é "Animação"; o resto é "Série".
export function getSeriesKind(series: TrackedSeries): SeriesKind {
  const isAnimation = series.generos.some((genre) => ANIMATION_GENRES.has(genre));
  if (!isAnimation) return 'series';
  return series.idiomaOriginal === 'ja' ? 'anime' : 'animation';
}

function memberWatched(progress: SeriesProgress, userId: string): number {
  return progress.membros.find((member) => member.usuarioId === userId)?.assistidos ?? 0;
}

// Com par, "assistida" é quando os dois viram tudo; sozinho, quando você viu tudo.
export function isFinished(progress: SeriesProgress, { meId, partnerId }: FilterContext): boolean {
  if (progress.totalEpisodios <= 0) return false;
  const watched = partnerId ? progress.emComum.assistidos : memberWatched(progress, meId);
  return watched >= progress.totalEpisodios;
}

// Filtro de uma série em aberto. "partner-ahead" é uma lente à parte: uma série em
// andamento em que o par está à frente também conta como "watching".
export function matchesProgress(
  progress: SeriesProgress,
  filter: ProgressFilter,
  { partnerId }: FilterContext,
): boolean {
  const started = progress.membros.some((member) => member.assistidos > 0);
  switch (filter) {
    case 'all':
      return true;
    case 'not-started':
      return !started;
    case 'watching':
      return started;
    case 'partner-ahead':
      return (
        !!partnerId &&
        (progress.membros.find((member) => member.usuarioId === partnerId)?.aFrente ?? 0) > 0
      );
  }
}

export function matchesKind(series: TrackedSeries, filter: KindFilter): boolean {
  return filter === 'all' || getSeriesKind(series) === filter;
}

export interface SplitEntries {
  // Séries em aberto que passam nos filtros: a grade principal.
  open: ListEntry[];
  // Séries que vocês já terminaram, do tipo escolhido: a seção "Assistidas". Só existe em
  // "Todas"; nos outros filtros fica vazia, porque séries terminadas não entram neles.
  finished: ListEntry[];
}

// Uma série cujo progresso ainda carrega fica em aberto (e só aparece em "Todas") até
// dar para saber onde ela entra.
export function splitEntries(
  entries: ListEntry[],
  progressFilter: ProgressFilter,
  kindFilter: KindFilter,
  context: FilterContext,
): SplitEntries {
  const open: ListEntry[] = [];
  const finished: ListEntry[] = [];
  for (const entry of entries) {
    if (!matchesKind(entry.series, kindFilter)) continue;
    if (entry.progress && isFinished(entry.progress, context)) {
      if (progressFilter === 'all') finished.push(entry);
      continue;
    }
    if (
      progressFilter === 'all' ||
      (entry.progress && matchesProgress(entry.progress, progressFilter, context))
    ) {
      open.push(entry);
    }
  }
  return { open, finished };
}

// Quantas séries em aberto cada filtro mostraria, dentro do tipo escolhido.
export function countByProgress(
  entries: ListEntry[],
  filters: ProgressFilter[],
  kindFilter: KindFilter,
  context: FilterContext,
): Partial<Record<ProgressFilter, number>> {
  return Object.fromEntries(
    filters.map((filter) => [
      filter,
      splitEntries(entries, filter, kindFilter, context).open.length,
    ]),
  );
}

// Tipos que existem na lista, na ordem de exibição. Um filtro só faz sentido com 2 ou mais.
export function presentKinds(entries: ListEntry[]): SeriesKind[] {
  const kinds = new Set(entries.map((entry) => getSeriesKind(entry.series)));
  return (['series', 'anime', 'animation'] as const).filter((kind) => kinds.has(kind));
}
