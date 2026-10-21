import { api } from '@/api/client';
import type {
  CommunitySeries,
  CoupleSuggestions,
  DiscoverOrigin,
  SeriesPreview,
  SeriesSearchResult,
} from '@/types/api';

// O que a tela de busca mostra antes de a pessoa digitar (ver /discover na API).
export const discoverService = {
  trending: (origin: DiscoverOrigin) =>
    api.get<SeriesSearchResult[]>(`/discover/trending?origin=${origin}`),
  onTheAir: (origin: DiscoverOrigin) =>
    api.get<SeriesSearchResult[]>(`/discover/on-the-air?origin=${origin}`),
  forUs: () => api.get<CoupleSuggestions>('/discover/for-us'),
  community: () => api.get<CommunitySeries[]>('/discover/community'),
  preview: (tmdbId: number) => api.get<SeriesPreview>(`/discover/series/${tmdbId}`),
};
