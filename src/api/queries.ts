import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { episodeService } from '@/api/services/episodeService';
import { groupService } from '@/api/services/groupService';
import { meService } from '@/api/services/meService';
import { progressService } from '@/api/services/progressService';
import { seriesService } from '@/api/services/seriesService';
import { telegramService } from '@/api/services/telegramService';
import type { AvatarStyleId } from '@/lib/avatarStyles';

// Each factory pairs a cache key with its fetcher. The returned queryKey is
// typed with its data, so setQueryData/getQueryData infer the right shape.
// `enabled` is left to the hooks, since it usually depends on UI state.

export const meQueries = {
  detail: () => queryOptions({ queryKey: queryKeys.me(), queryFn: meService.get }),
  telegram: () => queryOptions({ queryKey: queryKeys.telegram(), queryFn: telegramService.get }),
};

export const avatarQueries = {
  // O SVG de um estilo+semente nunca muda: gera uma vez e reaproveita em todas as telas.
  image: (style: AvatarStyleId, seed: string) =>
    queryOptions({
      queryKey: queryKeys.avatar(style, seed),
      queryFn: async () => (await import('@/lib/avatar')).renderAvatar(style, seed),
      staleTime: Infinity,
      gcTime: Infinity,
    }),
};

export const groupQueries = {
  mine: () => queryOptions({ queryKey: queryKeys.group(), queryFn: groupService.getMine }),
};

export const seriesQueries = {
  list: () => queryOptions({ queryKey: queryKeys.series.list(), queryFn: seriesService.list }),
  search: (query: string) =>
    queryOptions({
      queryKey: queryKeys.series.search(query),
      queryFn: () => seriesService.search(query),
    }),
  progress: (seriesId: string) =>
    queryOptions({
      queryKey: queryKeys.series.progress(seriesId),
      queryFn: () => progressService.get(seriesId),
    }),
};

export const seasonQueries = {
  episodes: (seriesId: string, season: number) =>
    queryOptions({
      queryKey: queryKeys.season.episodes(seriesId, season),
      queryFn: () => episodeService.listForSeason(seriesId, season),
    }),
  reactions: (seriesId: string, season: number) =>
    queryOptions({
      queryKey: queryKeys.season.reactions(seriesId, season),
      queryFn: () => episodeService.listSeasonReactions(seriesId, season),
    }),
};

export const episodeQueries = {
  reactions: (seriesId: string, season: number, episode: number) =>
    queryOptions({
      queryKey: queryKeys.episode.reactions(seriesId, season, episode),
      queryFn: () => episodeService.listReactions(seriesId, season, episode),
    }),
  comments: (seriesId: string, season: number, episode: number) =>
    queryOptions({
      queryKey: queryKeys.episode.comments(seriesId, season, episode),
      queryFn: () => episodeService.listComments(seriesId, season, episode),
    }),
};
