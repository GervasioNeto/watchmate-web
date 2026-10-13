import type {
  EpisodePosition,
  EpisodeProgressEntry,
  EpisodeWatcher,
  MemberProgress,
  SeasonSnapshot,
  SeriesProgress,
} from '@/types/api';

export function formatEpisodeCode({ temporada, episodio }: EpisodePosition): string {
  return `T${temporada} · E${episodio}`;
}

export function comparePositions(a: EpisodePosition, b: EpisodePosition): number {
  return a.temporada !== b.temporada ? a.temporada - b.temporada : a.episodio - b.episodio;
}

export function getSeasonTotal(temporadas: SeasonSnapshot[], season: number): number | null {
  return temporadas.find((entry) => entry.numero === season)?.totalEpisodios ?? null;
}

// Temporadas com episódios, em ordem. A temporada 0 do TMDB (especiais) fica por último.
export function getPlayableSeasons(temporadas: SeasonSnapshot[]): SeasonSnapshot[] {
  return temporadas
    .filter((entry) => entry.totalEpisodios > 0)
    .sort((a, b) => (a.numero === 0 ? 1 : b.numero === 0 ? -1 : a.numero - b.numero));
}

// Próximo episódio depois de `current`, ou null quando a série acabou.
export function getNextPosition(
  current: EpisodePosition | null,
  temporadas: SeasonSnapshot[],
): EpisodePosition | null {
  const seasons = getPlayableSeasons(temporadas).filter((entry) => entry.numero !== 0);
  if (!current) {
    return seasons[0] ? { temporada: seasons[0].numero, episodio: 1 } : null;
  }

  const seasonTotal = getSeasonTotal(temporadas, current.temporada);
  if (seasonTotal !== null && current.episodio < seasonTotal) {
    return { temporada: current.temporada, episodio: current.episodio + 1 };
  }

  const nextSeason = seasons.find((entry) => entry.numero > current.temporada);
  return nextSeason ? { temporada: nextSeason.numero, episodio: 1 } : null;
}

export function getMember(progress: SeriesProgress, userId: string): MemberProgress | null {
  return progress.membros.find((member) => member.usuarioId === userId) ?? null;
}

export function episodeKey(temporada: number, episodio: number): string {
  return `${temporada}:${episodio}`;
}

export function indexEpisodes(progress: SeriesProgress): Map<string, EpisodeProgressEntry> {
  return new Map(
    progress.episodios.map((entry) => [episodeKey(entry.temporada, entry.episodio), entry]),
  );
}

export interface EpisodeWatchStatus {
  me: EpisodeWatcher | null;
  partner: EpisodeWatcher | null;
}

export function getEpisodeWatchStatus(
  entry: EpisodeProgressEntry | undefined,
  meId: string,
  partnerId: string | null,
): EpisodeWatchStatus {
  const watchers = entry?.assistidoPor ?? [];
  return {
    me: watchers.find((watcher) => watcher.usuarioId === meId) ?? null,
    partner: partnerId
      ? (watchers.find((watcher) => watcher.usuarioId === partnerId) ?? null)
      : null,
  };
}

export function countWatchedInSeason(
  progress: SeriesProgress,
  season: number,
  userId: string,
): number {
  return progress.episodios.filter(
    (entry) =>
      entry.temporada === season &&
      entry.assistidoPor.some((watcher) => watcher.usuarioId === userId),
  ).length;
}

// Momento da última marcação de qualquer pessoa, em ms (0 se ninguém começou).
export function getLastActivityAt(progress: SeriesProgress): number {
  return progress.membros.reduce((latest, member) => {
    if (!member.ultimoAssistidoEm) return latest;
    return Math.max(latest, new Date(member.ultimoAssistidoEm).getTime());
  }, 0);
}

// Alguém já começou e ainda não terminaram juntos.
export function isInProgress(progress: SeriesProgress): boolean {
  const started = progress.membros.some((member) => member.assistidos > 0);
  const finishedTogether =
    progress.totalEpisodios > 0 && progress.emComum.assistidos >= progress.totalEpisodios;
  return started && !finishedTogether;
}
