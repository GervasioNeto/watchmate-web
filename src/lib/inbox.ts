import { calendarDaysUntil } from '@/lib/dates';
import type { InboxItem } from '@/types/api';

// Para onde cada aviso leva. Comentário e reação abrem o episódio já com a folha aberta
// (ver o ?episode= em EpisodesSection); o recado fica no card da dupla, no topo da lista.
export function inboxDestination(item: InboxItem): string {
  if (item.type === 'note') return '/my-list';
  if (!item.series) return '/my-list';
  const seriesPath = `/series/${item.series.id}`;
  if ((item.type === 'comment' || item.type === 'reaction') && item.season && item.episode) {
    return `${seriesPath}?episode=${item.season}-${item.episode}`;
  }
  return seriesPath;
}

export interface InboxDay {
  key: 'today' | 'yesterday' | 'week' | 'older';
  title: string;
  items: InboxItem[];
}

const DAY_TITLES: Record<InboxDay['key'], string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  week: 'Nesta semana',
  older: 'Antes',
};

// Os avisos em blocos de tempo, na ordem em que chegaram (a API manda do mais novo).
export function groupInboxByDay(items: InboxItem[], now: Date): InboxDay[] {
  const days: InboxDay[] = [];
  for (const item of items) {
    const ago = -calendarDaysUntil(new Date(item.at), now);
    const key = ago <= 0 ? 'today' : ago === 1 ? 'yesterday' : ago < 7 ? 'week' : 'older';
    const last = days.at(-1);
    if (last?.key === key) last.items.push(item);
    else days.push({ key, title: DAY_TITLES[key], items: [item] });
  }
  return days;
}

// "?episode=2-5" (de um aviso de comentário ou reação): a temporada e o episódio.
export function parseEpisodeLink(value: string | null): { season: number; episode: number } | null {
  const match = value ? /^(\d{1,3})-(\d{1,4})$/.exec(value) : null;
  if (!match) return null;
  const season = Number(match[1]);
  const episode = Number(match[2]);
  return episode >= 1 ? { season, episode } : null;
}
