import { api } from '@/api/client';
import type { EpisodeProgress } from '@/types/api';

export const progressService = {
  list: (seriesId: string) => api.get<EpisodeProgress[]>(`/series/${seriesId}/progress`),
  markEpisode: (seriesId: string, season: number, episode: number, watched: boolean) =>
    api.put<EpisodeProgress>(`/series/${seriesId}/seasons/${season}/episodes/${episode}`, {
      watched,
    }),
  markSeason: (seriesId: string, season: number, watched: boolean) =>
    api.put<EpisodeProgress[]>(`/series/${seriesId}/seasons/${season}/watched`, { watched }),
};
