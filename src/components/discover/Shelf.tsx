import { useId, type ReactNode } from 'react';
import { PosterRail, PosterRailError, PosterRailSkeleton } from '@/components/discover/PosterRail';
import type { SeriesSearchResult } from '@/types/api';

interface ShelfProps<T extends SeriesSearchResult> {
  title: string;
  subtitle?: ReactNode;
  // Antes do título (os avatares da dupla em "Para vocês dois").
  leading?: ReactNode;
  items: T[] | undefined;
  isPending: boolean;
  isError: boolean;
  isRefreshing?: boolean;
  onRetry: () => void;
  onOpen: (series: T) => void;
  renderBadge?: (series: T, index: number) => ReactNode;
  // Sem nada para mostrar: a estante some (o padrão) ou mostra este texto.
  emptyText?: string;
}

// Uma estante da busca: o título, uma linha dizendo de onde ela vem e a fileira de pôsteres,
// com o carregando e o erro no mesmo lugar, sem a tela pular.
export function Shelf<T extends SeriesSearchResult>({
  title,
  subtitle,
  leading,
  items,
  isPending,
  isError,
  isRefreshing,
  onRetry,
  onOpen,
  renderBadge,
  emptyText,
}: ShelfProps<T>) {
  const titleId = useId();
  const isEmpty = !isPending && !isError && (items?.length ?? 0) === 0;
  if (isEmpty && !emptyText) return null;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {leading}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 id={titleId} className="text-base leading-tight font-extrabold tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="truncate text-xs text-fg-muted">{subtitle}</p>}
        </div>
      </div>

      {isPending ? (
        <PosterRailSkeleton />
      ) : isError && !items ? (
        <PosterRailError onRetry={onRetry} />
      ) : isEmpty ? (
        <p className="text-sm text-fg-subtle">{emptyText}</p>
      ) : (
        <PosterRail
          label={title}
          items={items ?? []}
          onOpen={onOpen}
          renderBadge={renderBadge}
          isRefreshing={isRefreshing}
        />
      )}
    </section>
  );
}
