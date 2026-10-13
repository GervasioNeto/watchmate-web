import type { SeriesProgress, TrackedSeries } from '@/types/api';

// Filtro principal: onde o casal está na série.
export type ProgressFilter = 'all' | 'watching' | 'not-started' | 'finished' | 'partner-ahead';

// Filtro secundário: o tipo da série.
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

// Em qual filtro de progresso a série entra. "partner-ahead" é uma lente à parte:
// uma série em andamento em que o par está à frente também conta como "watching".
export function matchesProgress(
  progress: SeriesProgress,
  filter: ProgressFilter,
  { meId, partnerId }: FilterContext,
): boolean {
  if (filter === 'all') return true;

  const started = progress.membros.some((member) => member.assistidos > 0);
  // Com par, "terminada" é quando os dois viram tudo; sozinho, quando você viu tudo.
  const finished =
    progress.totalEpisodios > 0 &&
    (partnerId
      ? progress.emComum.assistidos >= progress.totalEpisodios
      : memberWatched(progress, meId) >= progress.totalEpisodios);

  switch (filter) {
    case 'not-started':
      return !started;
    case 'watching':
      return started && !finished;
    case 'finished':
      return finished;
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

// Enquanto o progresso de uma série carrega, ela só aparece em "Todas".
export function filterEntries(
  entries: ListEntry[],
  progressFilter: ProgressFilter,
  kindFilter: KindFilter,
  context: FilterContext,
): ListEntry[] {
  return entries.filter(
    (entry) =>
      matchesKind(entry.series, kindFilter) &&
      (progressFilter === 'all' ||
        (!!entry.progress && matchesProgress(entry.progress, progressFilter, context))),
  );
}

// Quantas séries cada filtro de progresso mostraria, dentro do tipo escolhido.
export function countByProgress(
  entries: ListEntry[],
  filters: ProgressFilter[],
  kindFilter: KindFilter,
  context: FilterContext,
): Partial<Record<ProgressFilter, number>> {
  return Object.fromEntries(
    filters.map((filter) => [filter, filterEntries(entries, filter, kindFilter, context).length]),
  );
}

// Tipos que existem na lista, na ordem de exibição. Um filtro só faz sentido com 2 ou mais.
export function presentKinds(entries: ListEntry[]): SeriesKind[] {
  const kinds = new Set(entries.map((entry) => getSeriesKind(entry.series)));
  return (['series', 'anime', 'animation'] as const).filter((kind) => kinds.has(kind));
}
