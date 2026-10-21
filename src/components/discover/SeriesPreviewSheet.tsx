import { useNavigate } from 'react-router-dom';
import { ExternalLink, Star } from 'lucide-react';
import { ApiError } from '@/api/client';
import { Synopsis } from '@/components/series/Synopsis';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSeriesPreview, useTrackedSeriesByTmdbId } from '@/hooks/useDiscover';
import { useAddSeries } from '@/hooks/useSeries';
import { pluralEpisodes } from '@/lib/coupleSummary';
import { airYears, pluralSeasons } from '@/lib/discover';
import { statusLabel } from '@/lib/seriesStatus';
import { tmdbBackdropUrl, tmdbPosterUrl } from '@/lib/tmdb';
import type { SeriesPreview, SeriesSearchResult } from '@/types/api';

const PROVIDER_LOGO_URL = 'https://image.tmdb.org/t/p/w92';

interface SeriesPreviewSheetProps {
  // A série tocada (o que a estante já sabia: nome, pôster, ano). Null fecha a folha.
  series: SeriesSearchResult | null;
  onClose: () => void;
  // A busca lembra o termo quando a pessoa adiciona dali.
  onAdded?: () => void;
  returnFocusTo?: HTMLElement | null;
}

// A prévia antes de adicionar: o essencial da série, onde assistir no Brasil e quantas
// duplas do WatchMate acompanham. O nome aparece na hora (veio da estante); o resto chega
// do TMDB. Adicionar leva para a série na lista, como na busca.
export function SeriesPreviewSheet({
  series,
  onClose,
  onAdded,
  returnFocusTo,
}: SeriesPreviewSheetProps) {
  const navigate = useNavigate();
  const preview = useSeriesPreview(series?.tmdbId ?? null);
  const tracked = useTrackedSeriesByTmdbId();
  const addSeries = useAddSeries();
  const trackedId = series ? tracked.get(series.tmdbId) : undefined;

  async function handleAdd() {
    if (!series) return;
    try {
      const added = await addSeries.mutateAsync(series.tmdbId);
      onAdded?.();
      navigate(`/series/${added.id}`);
    } catch {
      // O erro aparece embaixo (addSeries.error).
    }
  }

  const data = preview.data?.tmdbId === series?.tmdbId ? preview.data : undefined;
  const subtitle = data
    ? alternateName(data)
    : series?.englishName !== series?.name
      ? series?.englishName
      : null;

  return (
    <Sheet
      open={series !== null}
      onClose={onClose}
      title={series?.name ?? ''}
      description={subtitle ?? undefined}
      returnFocusTo={returnFocusTo}
      footer={
        trackedId ? (
          <Button onClick={() => navigate(`/series/${trackedId}`)} className="w-full">
            Abrir na lista de vocês
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            {addSeries.isError && (
              <p role="alert" className="text-sm text-danger">
                {addSeries.error instanceof ApiError
                  ? addSeries.error.message
                  : 'Não foi possível adicionar a série.'}
              </p>
            )}
            <Button onClick={handleAdd} isLoading={addSeries.isPending} className="w-full">
              Adicionar à lista
            </Button>
          </div>
        )
      }
    >
      {series && (
        <PreviewBody
          series={series}
          data={data}
          isPending={preview.isPending}
          isError={preview.isError}
          onRetry={() => void preview.refetch()}
        />
      )}
    </Sheet>
  );
}

// O nome original ou em inglês, quando difere do principal (séries asiáticas costumam ter os
// três).
function alternateName(data: SeriesPreview): string | null {
  // "PLS Love" e "Pls Love" são o mesmo nome: a comparação ignora maiúsculas.
  const seen = new Set([data.name.toLowerCase()]);
  const names: string[] = [];
  for (const name of [data.englishName, data.originalName]) {
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    names.push(name);
  }
  return names.length > 0 ? names.join(' · ') : null;
}

interface PreviewBodyProps {
  series: SeriesSearchResult;
  data: SeriesPreview | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

function PreviewBody({ series, data, isPending, isError, onRetry }: PreviewBodyProps) {
  const backdropUrl = tmdbBackdropUrl(data?.backdropPath ?? null);
  const posterUrl = tmdbPosterUrl(data?.posterPath ?? series.posterPath, 'w185');

  return (
    <div className="flex flex-col gap-5 pb-1">
      {/* O fundo da série, com o pôster na frente, como na página da série. */}
      <div className="relative">
        <div className="aspect-video overflow-hidden rounded-md bg-surface-2">
          {backdropUrl && <img src={backdropUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="absolute -bottom-4 left-3 aspect-2/3 w-16 overflow-hidden rounded-sm bg-surface-2 shadow-lg ring-2 ring-surface">
          {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
        </div>
      </div>

      {isError && !data ? (
        <div className="flex items-center justify-between gap-3 pt-3">
          <p className="text-sm text-fg-muted">Não deu para carregar os detalhes.</p>
          <Button variant="ghost" size="sm" onClick={onRetry} className="-mr-3 shrink-0">
            Tentar de novo
          </Button>
        </div>
      ) : isPending || !data ? (
        <div aria-label="Carregando a série" className="flex flex-col gap-3 pt-3">
          <Skeleton className="h-4 w-2/3 rounded-sm" />
          <Skeleton className="h-3 w-full rounded-sm" />
          <Skeleton className="h-3 w-5/6 rounded-sm" />
          <Skeleton className="mt-2 h-10 w-40 rounded-md" />
        </div>
      ) : (
        <PreviewDetails data={data} />
      )}
    </div>
  );
}

function PreviewDetails({ data }: { data: SeriesPreview }) {
  const facts = [
    airYears(data.firstAirYear, data.lastAirYear, data.status),
    statusLabel(data.status),
    data.seasonsCount > 0 ? pluralSeasons(data.seasonsCount) : null,
    data.episodesCount > 0 ? pluralEpisodes(data.episodesCount) : null,
  ].filter(Boolean);

  return (
    <>
      <div className="flex flex-col gap-1.5 pt-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
          {data.voteAverage !== null && (
            <span className="inline-flex items-center gap-1 font-semibold text-fg tabular-nums">
              <Star size={14} aria-hidden className="fill-current" />
              <span className="sr-only">Nota </span>
              {data.voteAverage.toFixed(1)}
            </span>
          )}
          <span>{facts.join(' · ')}</span>
        </p>
        {data.genres.length > 0 && (
          <p className="text-xs text-fg-subtle">{data.genres.join(', ')}</p>
        )}
      </div>

      {data.couplesTracking !== null && (
        <p className="flex items-center gap-2 text-sm text-fg">
          <svg viewBox="0 0 20 12" width="20" height="12" aria-hidden className="shrink-0">
            <circle cx="6" cy="6" r="5" className="fill-together" />
            <circle cx="14" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>
            <span className="font-bold tabular-nums">{data.couplesTracking} duplas</span> do
            WatchMate acompanham
          </span>
        </p>
      )}

      {data.overview ? (
        <Synopsis text={data.overview} />
      ) : (
        <p className="text-sm text-fg-subtle">O TMDB ainda não tem sinopse desta série.</p>
      )}

      <WhereToWatch watch={data.watch} />
    </>
  );
}

// Onde assistir no Brasil: os logos dos serviços (assinatura e grátis). Os dados são do
// JustWatch, e o link leva à página com todas as opções, inclusive aluguel e compra.
function WhereToWatch({ watch }: { watch: SeriesPreview['watch'] }) {
  return (
    <section
      aria-label="Onde assistir"
      className="flex flex-col gap-2.5 rounded-md bg-surface-2 p-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold">Onde assistir</h3>
        <span className="text-[11px] text-fg-subtle">dados do JustWatch</span>
      </div>
      {watch.providers.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {watch.providers.map((provider) => (
            <li
              key={provider.id}
              className="flex items-center gap-2 rounded-md bg-canvas py-1 pr-3 pl-1"
            >
              <img
                src={`${PROVIDER_LOGO_URL}${provider.logoPath}`}
                alt=""
                className="h-7 w-7 rounded-sm"
              />
              <span className="text-xs font-semibold">{provider.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-fg-muted">Sem streaming no Brasil por enquanto.</p>
      )}
      {watch.link && (
        <a
          href={watch.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start rounded-sm text-xs font-semibold text-fg-muted hover:text-fg"
        >
          Ver todas as opções
          <ExternalLink size={12} aria-hidden />
        </a>
      )}
    </section>
  );
}
