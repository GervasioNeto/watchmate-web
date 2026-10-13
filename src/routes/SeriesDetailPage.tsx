import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EpisodesSection } from '@/components/episodes/EpisodesSection';
import { SeriesProgressPanel } from '@/components/progress/SeriesProgressPanel';
import { Synopsis } from '@/components/series/Synopsis';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSeriesProgress } from '@/hooks/useSeriesProgress';
import { useDeleteSeries, useSeries } from '@/hooks/useSeries';
import { statusLabel } from '@/lib/seriesStatus';
import { tmdbBackdropUrl, tmdbPosterUrl } from '@/lib/tmdb';

function SeriesDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl pb-16" aria-label="Carregando série">
      <Skeleton className="aspect-video max-h-80 w-full" />
      <div className="relative -mt-12 flex items-end gap-4 px-4">
        <Skeleton className="aspect-2/3 w-24 shrink-0 rounded-md" />
        <div className="flex flex-1 flex-col gap-2 pb-1">
          <Skeleton className="h-6 w-3/4 rounded-sm" />
          <Skeleton className="h-3 w-1/2 rounded-sm" />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 px-4">
        <Skeleton className="h-3 w-full rounded-sm" />
        <Skeleton className="h-3 w-2/3 rounded-sm" />
      </div>
      <Skeleton className="mx-4 mt-6 h-48 rounded-lg" />
    </div>
  );
}

export function SeriesDetailPage() {
  const { seriesId = '' } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();

  const { data: allSeries, isLoading: isSeriesListLoading } = useSeries();
  const series = allSeries?.find((item) => item.id === seriesId);
  const progressQuery = useSeriesProgress(seriesId);
  const deleteSeries = useDeleteSeries();

  if (isSeriesListLoading) {
    return <SeriesDetailSkeleton />;
  }

  if (!series) {
    return (
      <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-4 px-4">
        <h1 className="text-xl font-bold">Série não encontrada</h1>
        <p className="text-sm text-fg-muted">Ela pode ter sido removida da lista de vocês.</p>
        <Button variant="secondary" onClick={() => navigate('/my-list')} className="self-start">
          Voltar para a lista
        </Button>
      </div>
    );
  }

  function handleDelete() {
    if (!series) return;
    if (!window.confirm(`Remover "${series.nome}" da lista? O progresso dos dois será apagado.`)) {
      return;
    }
    deleteSeries.mutate(series.id, { onSuccess: () => navigate('/my-list') });
  }

  const posterUrl = tmdbPosterUrl(series.posterPath, 'w342');
  const backdropUrl = tmdbBackdropUrl(series.backdropPath);
  const year = series.primeiraExibicaoEm ? new Date(series.primeiraExibicaoEm).getFullYear() : null;
  const altNames = [series.englishName, series.nomeOriginal].filter(
    (value, index, all): value is string =>
      !!value && value !== series.nome && all.indexOf(value) === index,
  );
  const metaLine = [
    year ? String(year) : null,
    statusLabel(series.status),
    series.generos.length > 0 ? series.generos.join(', ') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="relative">
        <div className="relative aspect-video max-h-80 w-full overflow-hidden bg-surface">
          {backdropUrl && <img src={backdropUrl} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-linear-to-t from-canvas via-canvas/40 to-transparent" />
        </div>
        <BackButton className="absolute top-3 left-3 bg-scrim" />
      </div>

      <header className="relative -mt-12 flex items-end gap-4 px-4">
        <div className="aspect-2/3 w-24 shrink-0 overflow-hidden rounded-md bg-surface ring-1 ring-line">
          {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 pb-1">
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight text-balance">
            {series.nome}
          </h1>
          {altNames.length > 0 && (
            <p className="truncate text-sm text-fg-subtle">{altNames.join(' · ')}</p>
          )}
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-3 px-4">
        {(series.notaMedia != null || metaLine) && (
          <p className="text-sm text-fg-muted">
            {series.notaMedia != null && (
              <span className="mr-2 inline-flex items-center gap-1 align-[-2px] text-fg">
                <Star size={14} aria-hidden className="fill-current" />
                <span className="sr-only">Nota </span>
                {series.notaMedia.toFixed(1)}
              </span>
            )}
            {metaLine}
          </p>
        )}

        {series.sinopse && <Synopsis text={series.sinopse} />}
      </div>

      <div className="mt-6 flex flex-col gap-8 px-4">
        {progressQuery.data ? (
          <>
            <SeriesProgressPanel series={series} progress={progressQuery.data} />
            <EpisodesSection series={series} progress={progressQuery.data} />
          </>
        ) : progressQuery.isError ? (
          <div className="flex flex-col items-start gap-3 rounded-lg bg-surface p-4">
            <p className="text-sm text-fg-muted">Não foi possível carregar o progresso.</p>
            <Button variant="secondary" size="sm" onClick={() => progressQuery.refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : (
          <Skeleton className="h-48 rounded-lg" />
        )}

        <div className="border-t border-line pt-4">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={deleteSeries.isPending}
            className="-ml-3"
          >
            Remover da lista
          </Button>
        </div>
      </div>
    </div>
  );
}
