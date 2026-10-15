import { computeCoupleStats } from '@/lib/coupleStats';
import { getMember } from '@/lib/progress';
import type { ListEntry } from '@/lib/seriesFilters';
import type { TrackedSeries } from '@/types/api';

// Os seus números no perfil (o canhoto do ingresso), do seu ponto de vista.
export interface ProfileHighlights {
  // Episódios que você viu, somando todas as séries.
  watched: number;
  // Desses, quantos vocês viram juntos (os dois marcaram como juntos).
  together: number;
  // Séries em que você já viu todos os episódios.
  finished: number;
  // A série em que você mais viu episódios.
  topSeries: { series: TrackedSeries; watched: number } | null;
}

// "Juntos" segue a mesma regra do placar da dupla (ver computeCoupleStats). Num empate
// de série mais vista, fica a que entrou na lista por último (a ordem das entradas).
export function computeProfileHighlights(
  entries: ListEntry[],
  meId: string,
  partnerId: string | null,
): ProfileHighlights {
  const summaries = entries.flatMap((entry) => (entry.progress ? [entry.progress] : []));
  const { mine, together } = computeCoupleStats(summaries, meId, partnerId);

  let finished = 0;
  let topSeries: ProfileHighlights['topSeries'] = null;
  for (const { series, progress } of entries) {
    if (!progress) continue;
    const watched = getMember(progress, meId)?.assistidos ?? 0;
    if (progress.totalEpisodios > 0 && watched >= progress.totalEpisodios) finished++;
    if (watched > 0 && (!topSeries || watched > topSeries.watched)) {
      topSeries = { series, watched };
    }
  }

  return { watched: mine, together, finished, topSeries };
}
