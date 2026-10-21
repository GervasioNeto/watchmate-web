import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { ApiError } from '@/api/client';
import { BackButton } from '@/components/BackButton';
import { DiscoverHome } from '@/components/discover/DiscoverHome';
import { SeriesPreviewSheet } from '@/components/discover/SeriesPreviewSheet';
import { Button } from '@/components/ui/Button';
import { useTrackedSeriesByTmdbId } from '@/hooks/useDiscover';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useSearchSeries } from '@/hooks/useSearchSeries';
import { useAddSeries } from '@/hooks/useSeries';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { SeriesSearchResult } from '@/types/api';

// Quem chega aqui por um botão "Adicionar" já quer digitar: o campo abre focado. Pela aba
// Buscar no celular, a pessoa veio explorar, e o teclado não cobre as estantes.
export interface AddSeriesLocationState {
  focusSearch?: boolean;
}

export function AddSeriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const { data: results, isFetching } = useSearchSeries(debouncedQuery);
  const tracked = useTrackedSeriesByTmdbId();
  const addSeries = useAddSeries();
  const recent = useRecentSearches();
  const [feedback, setFeedback] = useState<{ tmdbId: number; message: string } | null>(null);
  const [preview, setPreview] = useState<SeriesSearchResult | null>(null);
  const [previewTrigger, setPreviewTrigger] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const wantsFocus = (location.state as AddSeriesLocationState | null)?.focusSearch;
    if (wantsFocus || window.matchMedia('(min-width: 768px)').matches) inputRef.current?.focus();
  }, [location.state]);

  function openPreview(series: SeriesSearchResult) {
    setPreviewTrigger(
      document.activeElement instanceof HTMLElement ? document.activeElement : null,
    );
    setPreview(series);
  }

  // Buscar uma recente: o campo recebe o termo e a busca roda sem esperar a digitação.
  function searchAgain(term: string) {
    setQuery(term);
    recent.remember(term);
  }

  // Confirmar no teclado guarda a busca e fecha o teclado, para os resultados aparecerem.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    recent.remember(query);
    inputRef.current?.blur();
  }

  async function handleAdd(result: SeriesSearchResult) {
    setFeedback(null);
    recent.remember(query);
    try {
      const series = await addSeries.mutateAsync(result.tmdbId);
      navigate(`/series/${series.id}`, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível adicionar a série.';
      setFeedback({ tmdbId: result.tmdbId, message });
    }
  }

  const hasQuery = query.trim().length > 0;
  const hasDebouncedQuery = debouncedQuery.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-canvas px-4 py-2.5 md:px-2">
        {/* No celular a busca é um destino da barra de baixo: não tem "voltar". */}
        <div className="hidden md:block">
          <BackButton />
        </div>
        <form role="search" onSubmit={handleSubmit} className="flex flex-1">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-line bg-surface-2 pr-1 pl-3 focus-within:outline-2 focus-within:outline-accent">
            <Search size={18} aria-hidden className="shrink-0 text-fg-subtle" />
            <span className="sr-only">Buscar série</span>
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar série pelo nome"
              className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                aria-label="Limpar a busca"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-fg-subtle hover:text-fg"
              >
                <X size={18} aria-hidden />
              </button>
            )}
          </label>
        </form>
      </header>

      <main className="px-4 py-4">
        {!hasQuery ? (
          <DiscoverHome onOpen={openPreview} onPickRecent={searchAgain} />
        ) : !hasDebouncedQuery || (isFetching && !results) ? (
          <p className="pt-6 text-sm text-fg-subtle" aria-live="polite">
            Buscando…
          </p>
        ) : results && results.length > 0 ? (
          <ul className="flex flex-col" aria-busy={isFetching}>
            {results.map((result) => {
              const posterUrl = tmdbPosterUrl(result.posterPath, 'w185');
              const isTracked = tracked.has(result.tmdbId);
              const isAddingThis = addSeries.isPending && addSeries.variables === result.tmdbId;
              return (
                <li
                  key={result.tmdbId}
                  className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
                >
                  {/* A linha abre a prévia; o "Adicionar" ao lado é outro botão. */}
                  <button
                    type="button"
                    onClick={() => {
                      recent.remember(query);
                      openPreview(result);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left"
                  >
                    <span className="aspect-2/3 w-12 shrink-0 overflow-hidden rounded-sm bg-surface">
                      {posterUrl && (
                        <img
                          src={posterUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{result.name}</span>
                      <span className="block truncate text-xs text-fg-subtle">
                        {[
                          result.englishName !== result.name ? result.englishName : null,
                          result.firstAirYear,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      {feedback?.tmdbId === result.tmdbId && (
                        <span role="alert" className="mt-1 block text-xs text-danger">
                          {feedback.message}
                        </span>
                      )}
                    </span>
                  </button>
                  {isTracked ? (
                    <span className="shrink-0 px-3 text-sm text-fg-subtle">Na lista</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAdd(result)}
                      isLoading={isAddingThis}
                      disabled={addSeries.isPending && !isAddingThis}
                      className="shrink-0"
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

      <SeriesPreviewSheet
        series={preview}
        onClose={() => setPreview(null)}
        onAdded={() => recent.remember(query)}
        returnFocusTo={previewTrigger}
      />
    </div>
  );
}
