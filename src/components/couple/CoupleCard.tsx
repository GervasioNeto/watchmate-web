import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { CoupleStage } from '@/components/couple/CoupleStage';
import { DayDot } from '@/components/couple/DayDot';
import { Button } from '@/components/ui/Button';
import { useCouple } from '@/hooks/useCouple';
import {
  collectWatchEvents,
  lastSevenDays,
  sumActivity,
  togetherStreak,
  type DayActivity,
} from '@/lib/coupleActivity';
import { pluralEpisodes } from '@/lib/coupleSummary';
import type { Person } from '@/lib/people';
import type { ListEntry } from '@/lib/seriesFilters';

interface CoupleCardProps {
  groupName: string;
  entries: ListEntry[];
  isProgressLoading: boolean;
  onAdd: () => void;
}

// O resumo da semana no rodapé do card: um destaque em negrito e o resto da frase.
// Curto de propósito, para caber ao lado dos pontinhos até num celular de 360px.
function weekHeadline(days: DayActivity[]): { highlight: string; rest: string } {
  const streak = togetherStreak(days);
  if (streak >= 2) return { highlight: `${streak} dias seguidos`, rest: ' juntos' };
  const totals = sumActivity(days);
  if (totals.together > 0) return { highlight: `${totals.together} juntos`, rest: ' esta semana' };
  const total = totals.me + totals.partner;
  if (total > 0) return { highlight: pluralEpisodes(total), rest: ' esta semana' };
  return { highlight: '', rest: 'Semana sem episódios' };
}

interface WeekLinkProps {
  me: Person;
  partner: Person | null;
  entries: ListEntry[];
  isLoading: boolean;
}

// A porta para a página da dupla: um gostinho da semana (os 7 dias em pontinhos e uma
// frase) para dar motivo de entrar. O card em si não é link, porque o seu balão é botão.
function WeekLink({ me, partner, entries, isLoading }: WeekLinkProps) {
  const events = collectWatchEvents(entries, { meId: me.id, partnerId: partner?.id ?? null });
  const days = lastSevenDays(events, new Date());
  const { highlight, rest } = weekHeadline(days);

  return (
    <Link
      to="/couple"
      className="group flex min-h-12 items-center gap-3 rounded-b-lg border-t border-line px-4 py-3 text-sm transition-[background-color] hover:bg-surface-2"
    >
      <span aria-hidden className="flex gap-1">
        {days.map((day) =>
          isLoading ? (
            <span
              key={day.date.toISOString()}
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-line"
            />
          ) : (
            <DayDot
              key={day.date.toISOString()}
              day={day}
              me={me}
              partner={partner}
              className="h-2.5 w-2.5"
              emptyClassName="bg-line"
            />
          ),
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-fg-muted">
        {isLoading ? (
          'Carregando a semana…'
        ) : (
          <>
            <span className="font-semibold text-fg">{highlight}</span>
            {rest}
          </>
        )}
        <span className="sr-only">. Abrir a semana e o mês</span>
      </span>
      <ChevronRight
        size={18}
        aria-hidden
        className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
      />
    </Link>
  );
}

// O topo da lista: o nome do grupo, os dois com os recados de um para o outro e, no
// rodapé, a entrada para a página da dupla (semana, mês e o que mais vier).
export function CoupleCard({ groupName, entries, isProgressLoading, onAdd }: CoupleCardProps) {
  const { me, partner } = useCouple();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="rounded-lg bg-surface">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <h1
            id={headingId}
            className="line-clamp-2 min-w-0 pt-1 text-xl leading-tight font-extrabold tracking-tight break-words"
          >
            {groupName}
          </h1>
          <Button size="sm" onClick={onAdd} aria-label="Adicionar série" className="shrink-0">
            <Plus size={16} aria-hidden />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
        {me && <CoupleStage me={me} partner={partner} />}
      </div>
      {me && <WeekLink me={me} partner={partner} entries={entries} isLoading={isProgressLoading} />}
    </section>
  );
}
