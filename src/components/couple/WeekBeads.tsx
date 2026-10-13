import { DayDot } from '@/components/couple/DayDot';
import { describeDayCounts, type DayActivity } from '@/lib/coupleActivity';
import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';

interface WeekBeadsProps {
  days: DayActivity[];
  me: Person;
  partner: Person | null;
}

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Uma "conta" por dia dos últimos 7, com o número de episódios dentro.
export function WeekBeads({ days, me, partner }: WeekBeadsProps) {
  const lastIndex = days.length - 1;
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="Episódios por dia nos últimos 7 dias">
      {days.map((day, index) => {
        const isToday = index === lastIndex;
        const total = day.together + day.me + day.partner;
        const description = `${day.date.toLocaleDateString('pt-BR', { weekday: 'long' })}: ${describeDayCounts(day, partner?.shortName ?? null)}`;
        return (
          <li
            key={day.date.toISOString()}
            title={description}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              aria-hidden
              className={cx('text-xs', isToday ? 'font-bold text-fg' : 'text-fg-subtle')}
            >
              {isToday ? 'Hoje' : WEEKDAY_INITIALS[day.date.getDay()]}
            </span>
            <DayDot
              day={day}
              me={me}
              partner={partner}
              className="h-8 w-8 text-xs font-bold tabular-nums sm:h-9 sm:w-9"
              emptyClassName="border-2 border-dashed border-line"
            >
              {total > 0 ? total : undefined}
            </DayDot>
            <span className="sr-only">{description}</span>
          </li>
        );
      })}
    </ol>
  );
}
