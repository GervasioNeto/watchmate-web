import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Panel } from '@/components/ui/Panel';
import {
  formatActivityEpisodes,
  groupRecentActivity,
  type WatchEvent,
  type WatchEventKind,
} from '@/lib/coupleActivity';
import { formatTimeAgo } from '@/lib/dates';
import type { Person } from '@/lib/people';

interface RecentActivityProps {
  events: WatchEvent[];
  me: Person;
  partner: Person | null;
  now: Date;
}

const LIMIT = 8;

function whoWatched(kind: WatchEventKind, partner: Person | null): string {
  if (kind === 'together') return 'Vocês viram juntos';
  if (kind === 'partner' && partner) return `${partner.shortName} viu`;
  return 'Você viu';
}

// Os últimos episódios marcados, de quem quer que seja. Cada linha leva para a série.
export function RecentActivity({ events, me, partner, now }: RecentActivityProps) {
  const items = groupRecentActivity(events, LIMIT);

  return (
    <Panel title="Atividade recente">
      {items.length === 0 ? (
        <p className="text-sm text-fg-muted">
          Os episódios que {partner ? 'vocês marcarem' : 'você marcar'} aparecem aqui.
        </p>
      ) : (
        <ul className="-my-3 flex flex-col divide-y divide-line">
          {items.map((item) => (
            <li key={`${item.kind}-${item.seriesId}-${item.at.getTime()}`}>
              <Link
                to={`/series/${item.seriesId}`}
                className="group flex min-h-14 items-center gap-3 rounded-md py-3"
              >
                <span aria-hidden className="flex w-12 shrink-0">
                  {item.kind === 'together' && partner ? (
                    <>
                      <Avatar person={me} size="sm" className="ring-2 ring-surface" />
                      <Avatar person={partner} size="sm" className="-ml-2.5 ring-2 ring-surface" />
                    </>
                  ) : (
                    <Avatar person={item.kind === 'partner' ? partner : me} size="sm" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    <span className="font-semibold">{whoWatched(item.kind, partner)}</span>{' '}
                    {item.seriesName}
                  </span>
                  <span className="block truncate text-xs text-fg-muted">
                    {formatActivityEpisodes(item)} · {formatTimeAgo(item.at, now)}
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  aria-hidden
                  className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
