// Single source of truth for React Query cache keys. Keys are hierarchical, so
// invalidating a prefix (e.g. a whole season) also hits everything below it.
export const queryKeys = {
  me: () => ['me'] as const,
  group: () => ['group'] as const,

  series: {
    all: () => ['series'] as const,
    list: () => [...queryKeys.series.all(), 'list'] as const,
    search: (query: string) => [...queryKeys.series.all(), 'search', query] as const,
    detail: (seriesId: string) => [...queryKeys.series.all(), seriesId] as const,
    progress: (seriesId: string) => [...queryKeys.series.detail(seriesId), 'progress'] as const,
  },

  season: {
    all: (seriesId: string, season: number) =>
      [...queryKeys.series.detail(seriesId), 'season', season] as const,
    episodes: (seriesId: string, season: number) =>
      [...queryKeys.season.all(seriesId, season), 'episodes'] as const,
    reactions: (seriesId: string, season: number) =>
      [...queryKeys.season.all(seriesId, season), 'reactions'] as const,
  },

  episode: {
    all: (seriesId: string, season: number, episode: number) =>
      [...queryKeys.season.all(seriesId, season), 'episode', episode] as const,
    reactions: (seriesId: string, season: number, episode: number) =>
      [...queryKeys.episode.all(seriesId, season, episode), 'reactions'] as const,
    comments: (seriesId: string, season: number, episode: number) =>
      [...queryKeys.episode.all(seriesId, season, episode), 'comments'] as const,
  },
};

// Reações e comentários do parceiro vêm ocultos em episódios que você ainda não viu.
// Quando o seu progresso muda, essas listas precisam ser buscadas de novo.
export function isSpoilerSensitiveKey(seriesId: string) {
  const seriesPrefix = queryKeys.series.detail(seriesId);
  return (queryKey: readonly unknown[]) =>
    queryKey[0] === seriesPrefix[0] &&
    queryKey[1] === seriesPrefix[1] &&
    queryKey[2] === 'season' &&
    (queryKey.at(-1) === 'reactions' || queryKey.at(-1) === 'comments');
}

// Mutations que alteram o progresso de uma série compartilham a chave, para que os
// hooks saibam quando há mais de uma em andamento ao mesmo tempo.
export const mutationKeys = {
  progress: (seriesId: string) => ['progress', seriesId] as const,
};
