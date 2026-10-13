import { Navigate, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { InviteCode } from '@/components/InviteCode';
import { ContinueWatchingCard } from '@/components/series/ContinueWatchingCard';
import { SERIES_GRID, SeriesLibrary } from '@/components/series/SeriesLibrary';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useGroup } from '@/hooks/useGroup';
import { useSeries } from '@/hooks/useSeries';
import { useSeriesProgressList } from '@/hooks/useSeriesProgress';
import { getLastActivityAt, isInProgress } from '@/lib/progress';
import type { ListEntry } from '@/lib/seriesFilters';

export function MyListPage() {
  const navigate = useNavigate();
  const { me, partner } = useCouple();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const { data: series, isLoading: isSeriesLoading } = useSeries();
  const progressQueries = useSeriesProgressList((series ?? []).map((item) => item.id));

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  const entries: ListEntry[] = (series ?? []).map((item, index) => ({
    series: item,
    progress: progressQueries[index]?.data,
  }));
  const isProgressLoading = progressQueries.some((query) => query.isPending);

  // A série em andamento com a marcação mais recente de qualquer um dos dois.
  const continueWatching = entries
    .filter((entry) => entry.progress && isInProgress(entry.progress))
    .sort((a, b) => getLastActivityAt(b.progress!) - getLastActivityAt(a.progress!))[0];

  const goToAdd = () => navigate('/series/add');

  return (
    <div className="min-h-svh">
      <AppHeader />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-6 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex">
              <Avatar person={me} size="sm" className="ring-2 ring-canvas" />
              <Avatar person={partner} size="sm" className="-ml-2 ring-2 ring-canvas" />
            </div>
            <h1 className="truncate text-2xl font-extrabold tracking-tight">
              {group?.nome ?? 'Lista de vocês'}
            </h1>
          </div>
          <Button size="sm" onClick={goToAdd}>
            <Plus size={16} aria-hidden />
            Adicionar
          </Button>
        </div>

        {group && me && !partner && (
          <section className="flex flex-col gap-1 rounded-lg border border-line p-4">
            <h2 className="text-sm font-semibold">Convide seu par</h2>
            <p className="text-sm text-fg-muted">
              Mande esse código para a pessoa entrar no grupo pelo WatchMate.
            </p>
            <InviteCode code={group.codigoConvite} />
          </section>
        )}

        {isSeriesLoading ? (
          <div className="flex flex-col gap-8" aria-label="Carregando séries">
            <Skeleton className="h-36 rounded-lg" />
            <div className={SERIES_GRID}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-2/3 rounded-md" />
              ))}
            </div>
          </div>
        ) : entries.length > 0 ? (
          <>
            {continueWatching?.progress && (
              <ContinueWatchingCard
                series={continueWatching.series}
                progress={continueWatching.progress}
              />
            )}
            <SeriesLibrary entries={entries} isProgressLoading={isProgressLoading} />
          </>
        ) : (
          <section className="flex flex-col items-start gap-3 rounded-lg border border-line p-5">
            <h2 className="text-lg font-bold">Nenhuma série ainda</h2>
            <p className="text-sm text-fg-muted">
              Adicione a primeira série que vocês querem acompanhar.
            </p>
            <Button onClick={goToAdd}>Adicionar série</Button>
          </section>
        )}
      </main>
    </div>
  );
}
