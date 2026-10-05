import { api } from '@/api/client';
import type { SeriesSearchResult, TrackedSeries } from '@/types/api';

export const seriesService = {
  list: () => api.get<TrackedSeries[]>('/series'),
  search: (query: string) =>
    api.get<SeriesSearchResult[]>(`/series/search?q=${encodeURIComponent(query)}`),
  add: (tmdbId: number) => api.post<TrackedSeries>('/series', { tmdbId }),
  remove: (seriesId: string) => api.delete(`/series/${seriesId}`),
};
