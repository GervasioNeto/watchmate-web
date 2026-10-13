import { api } from '@/api/client';
import type { SeriesSearchResult, TrackedSeries, WatchMode } from '@/types/api';

export const seriesService = {
  list: () => api.get<TrackedSeries[]>('/series'),
  search: (query: string) =>
    api.get<SeriesSearchResult[]>(`/series/search?q=${encodeURIComponent(query)}`),
  add: (tmdbId: number) => api.post<TrackedSeries>('/series', { tmdbId }),
  updateMode: (seriesId: string, modo: WatchMode) =>
    api.patch<TrackedSeries>(`/series/${seriesId}`, { modo }),
  remove: (seriesId: string) => api.delete(`/series/${seriesId}`),
};
