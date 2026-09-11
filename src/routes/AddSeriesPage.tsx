import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { tmdbPosterUrl } from '@/lib/tmdb';
import { useAddSeries } from '@/hooks/useSeries';
import { useSearchSeries } from '@/hooks/useSearchSeries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { SeriesSearchResult } from '@/types/api';

export function AddSeriesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const { data: results, isFetching } = useSearchSeries(debouncedQuery);
  const addSeries = useAddSeries();

  const [feedback, setFeedback] = useState<{ tmdbId: number; message: string } | null>(null);

  async function handleAdd(result: SeriesSearchResult) {
    setFeedback(null);
    try {
      await addSeries.mutateAsync(result.tmdbId);
      navigate('/');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível adicionar a série.';
      setFeedback({ tmdbId: result.tmdbId, message });
    }
  }

  return (
    <div className="min-h-svh">
      <header className="flex items-center gap-3 border-b border-surface-border px-4 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="text-xl text-neutral-400"
        >
          ←
        </button>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar série pelo nome..."
          className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-white outline-none focus:border-flame"
        />
      </header>

      <div className="px-4 py-4">
        {debouncedQuery.trim().length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-500">
            Digite o nome de uma série pra começar.
          </p>
        ) : isFetching ? (
          <p className="mt-10 text-center text-sm text-neutral-500">Buscando…</p>
        ) : results && results.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {results.map((result) => {
              const posterUrl = tmdbPosterUrl(result.posterPath, 'w185');
              const isAddingThis = addSeries.isPending && addSeries.variables === result.tmdbId;
              return (
                <li key={result.tmdbId}>
                  <button
                    type="button"
                    onClick={() => handleAdd(result)}
                    disabled={addSeries.isPending}
                    className="flex w-full items-center gap-3 rounded-2xl border border-surface-border bg-surface-raised p-3 text-left transition-colors active:bg-surface-border/60 disabled:opacity-60"
                  >
                    <div className="aspect-2/3 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {posterUrl && (
                        <img src={posterUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm font-semibold text-white">
                        {result.name}
                      </p>
                      {result.firstAirYear && (
                        <p className="text-xs text-neutral-400">{result.firstAirYear}</p>
                      )}
                      {feedback?.tmdbId === result.tmdbId && (
                        <p className="mt-1 text-xs text-fuchsia">{feedback.message}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm text-neutral-500">
                      {isAddingThis ? 'Adicionando…' : '+'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-10 text-center text-sm text-neutral-500">Nenhum resultado encontrado.</p>
        )}
      </div>
    </div>
  );
}
