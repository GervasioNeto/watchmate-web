import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ApiError } from '@/api/client';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/Button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchSeries } from '@/hooks/useSearchSeries';
import { useAddSeries, useSeries } from '@/hooks/useSeries';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { SeriesSearchResult } from '@/types/api';

export function AddSeriesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const { data: results, isFetching } = useSearchSeries(debouncedQuery);
  const { data: tracked } = useSeries();
  const addSeries = useAddSeries();
  const [feedback, setFeedback] = useState<{ tmdbId: number; message: string } | null>(null);

  const trackedIds = new Set(tracked?.map((item) => item.tmdbId));

  async function handleAdd(result: SeriesSearchResult) {
    setFeedback(null);
    try {
      const series = await addSeries.mutateAsync(result.tmdbId);
      navigate(`/series/${series.id}`, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível adicionar a série.';
      setFeedback({ tmdbId: result.tmdbId, message });
    }
  }

  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <div className="mx-auto min-h-svh max-w-2xl">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-canvas px-2 py-2.5">
        <BackButton />
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-line bg-surface-2 px-3 focus-within:outline-2 focus-within:outline-accent">
          <Search size={18} aria-hidden className="shrink-0 text-fg-subtle" />
          <span className="sr-only">Buscar série</span>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar série pelo nome"
            className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none sm:text-sm"
          />
        </label>
      </header>

      <main className="px-4 py-4">
        {!hasQuery ? (
          <p className="pt-6 text-sm text-fg-subtle">
            Busque pelo nome em português ou no idioma original.
          </p>
        ) : isFetching && !results ? (
          <p className="pt-6 text-sm text-fg-subtle" aria-live="polite">
            Buscando…
          </p>
        ) : results && results.length > 0 ? (
          <ul className="flex flex-col" aria-busy={isFetching}>
            {results.map((result) => {
              const posterUrl = tmdbPosterUrl(result.posterPath, 'w185');
              const isTracked = trackedIds.has(result.tmdbId);
              const isAddingThis = addSeries.isPending && addSeries.variables === result.tmdbId;
              return (
                <li
                  key={result.tmdbId}
                  className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
                >
                  <div className="aspect-2/3 w-12 shrink-0 overflow-hidden rounded-sm bg-surface">
                    {posterUrl && (
                      <img
                        src={posterUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{result.name}</p>
                    <p className="truncate text-xs text-fg-subtle">
                      {[
                        result.englishName !== result.name ? result.englishName : null,
                        result.firstAirYear,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {feedback?.tmdbId === result.tmdbId && (
                      <p role="alert" className="mt-1 text-xs text-danger">
                        {feedback.message}
                      </p>
                    )}
                  </div>
                  {isTracked ? (
                    <span className="shrink-0 px-3 text-sm text-fg-subtle">Na lista</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAdd(result)}
                      isLoading={isAddingThis}
                      disabled={addSeries.isPending && !isAddingThis}
                    >
                      Adicionar
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="pt-6 text-sm text-fg-subtle">Nenhuma série encontrada.</p>
        )}
      </main>
    </div>
  );
}
