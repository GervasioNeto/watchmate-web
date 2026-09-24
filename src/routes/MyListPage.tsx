import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { ContinueWatchingCard } from '@/components/ContinueWatchingCard';
import { SeriesCard } from '@/components/SeriesCard';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/Button';
import { useEpisodeProgressForSeries } from '@/hooks/useEpisodeProgress';
import { useMe } from '@/hooks/useMe';
import { useGroup } from '@/hooks/useGroup';
import { useSeries } from '@/hooks/useSeries';
import { getSeriesProgressPercent } from '@/lib/progress';

export function MyListPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const { data: series, isLoading: isSeriesLoading } = useSeries();

  const progressQueries = useEpisodeProgressForSeries((series ?? []).map((item) => item.id));

  const continueWatching = useMemo(() => {
    if (!series) return null;

    const candidates = series
      .map((item, index) => {
        const progress = progressQueries[index]?.data ?? [];
        const percent = getSeriesProgressPercent(progress, item.temporadas) ?? 0;
        const lastWatchedAt = progress.reduce((latest, entry) => {
          if (!entry.assistidoEm) return latest;
          return Math.max(latest, new Date(entry.assistidoEm).getTime());
        }, 0);
        return { item, progress, percent, lastWatchedAt };
      })
      .filter((candidate) => candidate.percent > 0 && candidate.percent < 100);

    if (candidates.length === 0) return null;

    return candidates.reduce((best, candidate) =>
      candidate.lastWatchedAt > best.lastWatchedAt ? candidate : best,
    );
  }, [series, progressQueries]);

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  const partner = me?.membroDoGrupo?.grupo.membros.find((member) => member.usuario.id !== me?.id);
  const meLetter = (me?.nome ?? me?.email ?? 'V')[0]?.toUpperCase() ?? 'V';
  const partnerLetter = partner
    ? ((partner.usuario.nome ?? partner.usuario.email)[0]?.toUpperCase() ?? '♥')
    : null;
  const restOfSeries = series?.filter((item) => item.id !== continueWatching?.item.id) ?? [];

  return (
    <div className="min-h-svh pb-28">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-4 pt-4 pb-2">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ultramarine font-heading text-sm font-semibold text-white ring-2 ring-surface">
            {meLetter}
          </div>
          <div
            className={`-ml-3 flex h-9 w-9 items-center justify-center rounded-full font-heading text-sm font-semibold ring-2 ring-surface ${
              partner
                ? 'bg-fuchsia text-white'
                : 'border-2 border-dashed border-surface-border bg-surface text-neutral-500'
            }`}
          >
            {partnerLetter ?? '♥'}
          </div>
        </div>
      </div>

      {!partner && group && (
        <div className="mx-auto mb-4 max-w-6xl px-4">
          <div className="rounded-xl border border-surface-border bg-surface-raised px-4 py-3">
            <p className="text-xs text-neutral-400">Convide seu par com o código</p>
            <p className="font-mono text-lg font-semibold tracking-[0.2em] text-amber">
              {group.codigoConvite}
            </p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4">
        {isSeriesLoading ? (
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 rounded-2xl border border-surface-border bg-surface-raised p-4">
              <Skeleton className="aspect-2/3 w-20 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-1 h-1.5 w-full max-w-52" />
              </div>
              <Skeleton className="h-10 w-10 shrink-0 self-center rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton key={index} className="aspect-2/3 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : series && series.length > 0 ? (
          <div className="flex flex-col gap-6">
            {continueWatching && (
              <ContinueWatchingCard
                series={continueWatching.item}
                progress={continueWatching.progress}
              />
            )}

            <div>
              {continueWatching && restOfSeries.length > 0 && (
                <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-400">
                  Toda a lista
                </h2>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {restOfSeries.map((item) => (
                  <SeriesCard key={item.id} series={item} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">🍿</div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">Nenhuma série ainda</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Adicione a primeira série que vocês querem acompanhar juntos.
              </p>
            </div>
            <Button onClick={() => navigate('/series/add')}>Adicionar primeira série</Button>
          </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => navigate('/series/add')}
        aria-label="Adicionar série"
        className="fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-flame text-2xl text-white shadow-lg shadow-flame/30 transition-transform active:scale-95"
      >
        +
      </button>
    </div>
  );
}
