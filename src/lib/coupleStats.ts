import type { SeriesProgress } from '@/types/api';

export interface CoupleStats {
  // Episódios que cada um já viu, somando todas as séries (inclui os vistos juntos).
  mine: number;
  partners: number;
  // Episódios marcados como "assistimos juntos" pelos dois.
  together: number;
  seriesCount: number;
  // Séries em que os dois já viram todos os episódios.
  finishedTogether: number;
}

export function computeCoupleStats(
  summaries: SeriesProgress[],
  meId: string,
  partnerId: string | null,
): CoupleStats {
  const stats: CoupleStats = {
    mine: 0,
    partners: 0,
    together: 0,
    seriesCount: summaries.length,
    finishedTogether: 0,
  };

  for (const summary of summaries) {
    for (const member of summary.membros) {
      if (member.usuarioId === meId) stats.mine += member.assistidos;
      if (partnerId && member.usuarioId === partnerId) stats.partners += member.assistidos;
    }

    if (!partnerId) continue;

    for (const entry of summary.episodios) {
      const mine = entry.assistidoPor.find((watcher) => watcher.usuarioId === meId);
      const theirs = entry.assistidoPor.find((watcher) => watcher.usuarioId === partnerId);
      if (mine?.juntos && theirs?.juntos) stats.together++;
    }

    if (summary.totalEpisodios > 0 && summary.emComum.assistidos >= summary.totalEpisodios) {
      stats.finishedTogether++;
    }
  }

  return stats;
}
