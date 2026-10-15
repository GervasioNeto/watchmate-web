import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ActivityLegend } from '@/components/couple/ActivityLegend';
import { DayDot } from '@/components/couple/DayDot';
import { IconButton } from '@/components/ui/IconButton';
import { Panel } from '@/components/ui/Panel';
import { useMonthParam } from '@/hooks/useMonthParam';
import {
  describeDayCounts,
  longestTogetherStreak,
  monthActivity,
  type WatchEvent,
} from '@/lib/coupleActivity';
import { cx } from '@/lib/cx';
import { formatMonth, isSameDay, startOfMonth } from '@/lib/dates';
import type { Person } from '@/lib/people';

interface MonthCalendarProps {
  events: WatchEvent[];
  me: Person;
  partner: Person | null;
  // Desde quando a dupla existe: o primeiro mês que dá para ver.
  since: Date;
  now: Date;
}

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// O mês em calendário, cada dia pintado como as contas da semana. Dá para voltar aos
// meses anteriores, até o mês em que a dupla começou (ou o primeiro episódio marcado).
export function MonthCalendar({ events, me, partner, since, now }: MonthCalendarProps) {
  const earliest = events.at(-1)?.at;
  const first = startOfMonth(earliest && earliest < since ? earliest : since);
  const { month, canGoBack, canGoForward, goBack, goForward } = useMonthParam(
    first,
    startOfMonth(now),
  );

  const days = monthActivity(events, month);
  const isEmpty = days.every((day) => day.together + day.me + day.partner === 0);
  const bestStreak = longestTogetherStreak(days);
  const monthName = formatMonth(month);
  const partnerName = partner?.shortName ?? null;

  return (
    <Panel
      title={monthName.charAt(0).toUpperCase() + monthName.slice(1)}
      aside={
        <div className="-mr-2 flex">
          <IconButton size="sm" aria-label="Mês anterior" disabled={!canGoBack} onClick={goBack}>
            <ChevronLeft size={18} aria-hidden />
          </IconButton>
          <IconButton
            size="sm"
            aria-label="Próximo mês"
            disabled={!canGoForward}
            onClick={goForward}
          >
            <ChevronRight size={18} aria-hidden />
          </IconButton>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <div aria-hidden className="grid grid-cols-7 justify-items-center text-xs text-fg-subtle">
          {WEEKDAY_INITIALS.map((initial, index) => (
            <span key={index}>{initial}</span>
          ))}
        </div>
        <ol
          aria-label={`Episódios por dia em ${monthName}`}
          className="grid grid-cols-7 justify-items-center gap-y-1.5"
        >
          {Array.from({ length: month.getDay() }, (_, index) => (
            <li key={`vazio-${index}`} aria-hidden />
          ))}
          {days.map((day) => {
            const isToday = isSameDay(day.date, now);
            const description = `${day.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}: ${describeDayCounts(day, partnerName)}`;
            return (
              <li key={day.date.toISOString()} title={description}>
                <DayDot
                  day={day}
                  me={me}
                  partner={partner}
                  className={cx(
                    'h-9 w-9 text-xs font-semibold tabular-nums',
                    isToday && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                  )}
                  emptyClassName={day.date > now ? 'text-fg-subtle opacity-40' : 'text-fg-muted'}
                >
                  {day.date.getDate()}
                </DayDot>
                <span className="sr-only">{description}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {isEmpty ? (
        <p className="text-xs text-fg-muted">Nenhum episódio em {monthName}.</p>
      ) : (
        <ActivityLegend days={days} me={me} partner={partner} />
      )}
      {bestStreak >= 2 && (
        <p className="flex items-center gap-2 text-sm">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-together" />
          <span>
            Melhor sequência: <span className="font-bold">{bestStreak} dias seguidos</span> juntos
          </span>
        </p>
      )}
    </Panel>
  );
}
