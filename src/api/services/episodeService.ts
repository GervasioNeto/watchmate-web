import { api } from '@/api/client';
import type { EpisodeComment, EpisodeReaction, SeasonEpisode, SeasonReaction } from '@/types/api';

function seasonPath(seriesId: string, season: number) {
  return `/series/${seriesId}/seasons/${season}`;
}

function episodePath(seriesId: string, season: number, episode: number) {
  return `${seasonPath(seriesId, season)}/episodes/${episode}`;
}

export const episodeService = {
  listForSeason: (seriesId: string, season: number) =>
    api.get<SeasonEpisode[]>(`${seasonPath(seriesId, season)}/episodes`),
  listSeasonReactions: (seriesId: string, season: number) =>
    api.get<SeasonReaction[]>(`${seasonPath(seriesId, season)}/reactions`),

  listReactions: (seriesId: string, season: number, episode: number) =>
    api.get<EpisodeReaction[]>(`${episodePath(seriesId, season, episode)}/reactions`),
  setReaction: (seriesId: string, season: number, episode: number, emoji: string) =>
    api.put<EpisodeReaction>(`${episodePath(seriesId, season, episode)}/reaction`, { emoji }),

  listComments: (seriesId: string, season: number, episode: number) =>
    api.get<EpisodeComment[]>(`${episodePath(seriesId, season, episode)}/comments`),
  addComment: (seriesId: string, season: number, episode: number, texto: string) =>
    api.post<EpisodeComment>(`${episodePath(seriesId, season, episode)}/comments`, { texto }),
  deleteComment: (seriesId: string, season: number, episode: number, commentId: string) =>
    api.delete(`${episodePath(seriesId, season, episode)}/comments/${commentId}`),
};
