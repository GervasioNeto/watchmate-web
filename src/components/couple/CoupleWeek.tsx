import { ActivityLegend } from '@/components/couple/ActivityLegend';
import { WeekBeads } from '@/components/couple/WeekBeads';
import { Panel } from '@/components/ui/Panel';
import { lastSevenDays, togetherStreak, type WatchEvent } from '@/lib/coupleActivity';
import type { Person } from '@/lib/people';

interface CoupleWeekProps {
  events: WatchEvent[];
  me: Person;
  partner: Person | null;
  now: Date;
}

// Os últimos 7 dias, um por conta, e a sequência de dias vendo juntos que ainda vale.
export function CoupleWeek({ events, me, partner, now }: CoupleWeekProps) {
  const days = lastSevenDays(events, now);
  const isEmpty = days.every((day) => day.together + day.me + day.partner === 0);
  const streak = togetherStreak(days);

  return (
    <Panel title={partner ? 'A semana de vocês' : 'Sua semana'}>
      <WeekBeads days={days} me={me} partner={partner} />
      {isEmpty ? (
        <p className="text-xs text-fg-muted">Nenhum episódio nos últimos 7 dias.</p>
      ) : (
        <ActivityLegend days={days} me={me} partner={partner} />
      )}
      {streak >= 2 && (
        <p className="flex items-center gap-2 text-sm">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-together" />
          <span>
            <span className="font-bold">{streak} dias seguidos</span> vendo juntos
          </span>
        </p>
      )}
    </Panel>
  );
}
