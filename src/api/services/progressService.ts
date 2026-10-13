import { api } from '@/api/client';
import type { ProgressScope, SeriesProgress } from '@/types/api';

export interface MarkEpisodeInput {
  season: number;
  episode: number;
  watched: boolean;
  // Sem scope, a API segue o modo da série (JUNTOS marca para os dois).
  scope?: ProgressScope;
}

export interface MarkSeasonInput {
  season: number;
  watched: boolean;
  scope?: ProgressScope;
}

// Toda rota que altera progresso devolve o resumo completo da série.
export const progressService = {
  get: (seriesId: string) => api.get<SeriesProgress>(`/series/${seriesId}/progress`),
  markEpisode: (seriesId: string, { season, episode, watched, scope }: MarkEpisodeInput) =>
    api.put<SeriesProgress>(`/series/${seriesId}/seasons/${season}/episodes/${episode}`, {
      watched,
      scope,
    }),
  markSeason: (seriesId: string, { season, watched, scope }: MarkSeasonInput) =>
    api.put<SeriesProgress>(`/series/${seriesId}/seasons/${season}/watched`, { watched, scope }),
  // Marca para você tudo o que o parceiro já viu e você ainda não.
  catchUp: (seriesId: string) => api.post<SeriesProgress>(`/series/${seriesId}/catch-up`),
};
