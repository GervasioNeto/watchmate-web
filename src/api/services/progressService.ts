import { api } from '@/api/client';
import type { ProgressScope, SeriesProgress } from '@/types/api';

// O app sempre diz para quem vale a marcação (`scope`); o modo da série não é usado.
export interface MarkEpisodeInput {
  season: number;
  episode: number;
  watched: boolean;
  scope: ProgressScope;
  // Marcações para os dois: assistiram juntos (true) ou cada um em outro momento (false).
  together?: boolean;
}

export interface MarkSeasonInput {
  season: number;
  watched: boolean;
  scope: ProgressScope;
  together?: boolean;
}

// Toda rota que altera progresso devolve o resumo completo da série.
export const progressService = {
  get: (seriesId: string) => api.get<SeriesProgress>(`/series/${seriesId}/progress`),
  markEpisode: (
    seriesId: string,
    { season, episode, watched, scope, together }: MarkEpisodeInput,
  ) =>
    api.put<SeriesProgress>(`/series/${seriesId}/seasons/${season}/episodes/${episode}`, {
      watched,
      scope,
      juntos: together,
    }),
  markSeason: (seriesId: string, { season, watched, scope, together }: MarkSeasonInput) =>
    api.put<SeriesProgress>(`/series/${seriesId}/seasons/${season}/watched`, {
      watched,
      scope,
      juntos: together,
    }),
  // Marca para você tudo o que o parceiro já viu e você ainda não.
  catchUp: (seriesId: string) => api.post<SeriesProgress>(`/series/${seriesId}/catch-up`),
};
