import type { EpisodeProgress, SeasonSnapshot } from '@/types/api';

export interface EpisodePosition {
  season: number;
  episode: number;
}

export function getCurrentPosition(progress: EpisodeProgress[]): EpisodePosition | null {
  const watched = progress.filter((entry) => entry.assistidoEm);
  if (watched.length === 0) return null;

  return watched.reduce<EpisodePosition>(
    (latest, entry) => {
      const isLater =
        entry.temporada > latest.season ||
        (entry.temporada === latest.season && entry.episodio > latest.episode);
      return isLater ? { season: entry.temporada, episode: entry.episodio } : latest;
    },
    { season: watched[0].temporada, episode: watched[0].episodio },
  );
}

export function getSeasonTotal(temporadas: SeasonSnapshot[], season: number): number | null {
  return temporadas.find((entry) => entry.numero === season)?.totalEpisodios ?? null;
}

export function getSeriesTotalEpisodes(temporadas: SeasonSnapshot[]): number {
  return temporadas.reduce((sum, entry) => sum + entry.totalEpisodios, 0);
}

export function getWatchedCount(progress: EpisodeProgress[]): number {
  return progress.filter((entry) => entry.assistidoEm).length;
}

export function getSeriesProgressPercent(
  progress: EpisodeProgress[],
  temporadas: SeasonSnapshot[],
): number | null {
  const total = getSeriesTotalEpisodes(temporadas);
  if (total === 0) return null;
  return Math.min(100, Math.round((getWatchedCount(progress) / total) * 100));
}

export function getNextEpisode(
  progress: EpisodeProgress[],
  temporadas: SeasonSnapshot[] = [],
): EpisodePosition {
  const current = getCurrentPosition(progress);
  if (!current) {
    const firstSeason = temporadas.length > 0 ? Math.min(...temporadas.map((t) => t.numero)) : 1;
    return { season: firstSeason, episode: 1 };
  }

  const seasonTotal = getSeasonTotal(temporadas, current.season);
  if (seasonTotal !== null && current.episode >= seasonTotal) {
    const nextSeason = temporadas
      .map((entry) => entry.numero)
      .filter((numero) => numero > current.season)
      .sort((a, b) => a - b)[0];
    return { season: nextSeason ?? current.season + 1, episode: 1 };
  }

  return { season: current.season, episode: current.episode + 1 };
}
