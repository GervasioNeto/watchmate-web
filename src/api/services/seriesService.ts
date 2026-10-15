import { api } from '@/api/client';
import type { SeriesInterest, SeriesSearchResult, TrackedSeries } from '@/types/api';

export const seriesService = {
  list: () => api.get<TrackedSeries[]>('/series'),
  search: (query: string) =>
    api.get<SeriesSearchResult[]>(`/series/search?q=${encodeURIComponent(query)}`),
  add: (tmdbId: number) => api.post<TrackedSeries>('/series', { tmdbId }),
  remove: (seriesId: string) => api.delete(`/series/${seriesId}`),
  // "Quero ver": marca ou desmarca para você; devolve quem quer ver agora.
  setInterest: (seriesId: string, wants: boolean) =>
    wants
      ? api.put<SeriesInterest>(`/series/${seriesId}/interest`)
      : api.delete<SeriesInterest>(`/series/${seriesId}/interest`),
};
