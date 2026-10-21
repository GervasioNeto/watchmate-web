import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';

// O que cada aviso muda no app, pela tag que a API põe nele (ver messages.ts no
// watchmate-api). "Entre vocês" muda sempre.
function keysForTag(tag: string): QueryKey[] {
  const [kind, seriesId, season, episode] = tag.split(':');
  const keys: QueryKey[] = [queryKeys.inbox.all()];
  const s = Number(season);
  const e = Number(episode);

  switch (kind) {
    case 'invite':
      keys.push(queryKeys.invites.all());
      break;
    // O recado vem junto com o /me.
    case 'note':
      keys.push(queryKeys.me());
      break;
    case 'progress':
      if (seriesId) keys.push(queryKeys.series.progress(seriesId));
      break;
    case 'series-added':
      keys.push(queryKeys.series.list());
      break;
    case 'comments':
      if (seriesId && s && e) {
        keys.push(
          queryKeys.episode.comments(seriesId, s, e),
          queryKeys.season.commentCounts(seriesId, s),
        );
      }
      break;
    case 'reaction':
      if (seriesId && s && e) {
        keys.push(
          queryKeys.episode.reactions(seriesId, s, e),
          queryKeys.season.reactions(seriesId, s),
        );
      }
      break;
  }
  return keys;
}

// Chegou um push com o app aberto (o service worker avisa; ver public/sw.js): o que ele
// mudou é buscado de novo na hora. O par topou o convite e o carimbo aparece sozinho.
export function usePushUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const { type, tag } = (event.data ?? {}) as { type?: unknown; tag?: unknown };
      if (type !== 'push') return;
      const keys = typeof tag === 'string' ? keysForTag(tag) : [queryKeys.inbox.all()];
      for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey });
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [queryClient]);
}
