import { api } from '@/api/client';
import type {
  EpisodeComment,
  EpisodeCommentCount,
  EpisodeReaction,
  SeasonEpisode,
} from '@/types/api';

function seasonPath(seriesId: string, season: number) {
  return `/series/${seriesId}/seasons/${season}`;
}

function episodePath(seriesId: string, season: number, episode: number) {
  return `${seasonPath(seriesId, season)}/episodes/${episode}`;
}

// As escritas devolvem a linha crua (sem `oculto`/`usuario`); os hooks revalidam a
// lista em seguida, então a resposta delas não é usada.
export const episodeService = {
  listForSeason: (seriesId: string, season: number) =>
    api.get<SeasonEpisode[]>(`${seasonPath(seriesId, season)}/episodes`),
  listSeasonReactions: (seriesId: string, season: number) =>
    api.get<EpisodeReaction[]>(`${seasonPath(seriesId, season)}/reactions`),
  listSeasonCommentCounts: (seriesId: string, season: number) =>
    api.get<EpisodeCommentCount[]>(`${seasonPath(seriesId, season)}/comment-counts`),

  listReactions: (seriesId: string, season: number, episode: number) =>
    api.get<EpisodeReaction[]>(`${episodePath(seriesId, season, episode)}/reactions`),
  setReaction: (seriesId: string, season: number, episode: number, emoji: string) =>
    api.put<unknown>(`${episodePath(seriesId, season, episode)}/reaction`, { emoji }),

  listComments: (seriesId: string, season: number, episode: number) =>
    api.get<EpisodeComment[]>(`${episodePath(seriesId, season, episode)}/comments`),
  addComment: (seriesId: string, season: number, episode: number, texto: string) =>
    api.post<unknown>(`${episodePath(seriesId, season, episode)}/comments`, { texto }),
  deleteComment: (seriesId: string, season: number, episode: number, commentId: string) =>
    api.delete(`${episodePath(seriesId, season, episode)}/comments/${commentId}`),
};
