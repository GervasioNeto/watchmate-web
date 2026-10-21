import { useRef, type ReactNode } from 'react';
import { PosterTile } from '@/components/discover/PosterTile';
import { Button } from '@/components/ui/Button';
import { ScrollEdge } from '@/components/ui/ScrollEdge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTrackedSeriesByTmdbId } from '@/hooks/useDiscover';
import { useScrollEdges } from '@/hooks/useScrollEdges';
import { cx } from '@/lib/cx';
import type { SeriesSearchResult } from '@/types/api';

interface PosterRailProps<T extends SeriesSearchResult> {
  label: string;
  items: T[];
  onOpen: (series: T) => void;
  renderBadge?: (series: T, index: number) => ReactNode;
  // Trocando de origem: a lista antiga fica, apagada, até a nova chegar.
  isRefreshing?: boolean;
}

// Uma fileira de pôsteres que rola para o lado e encaixa em cada pôster, de borda a borda
// da tela (passa por baixo do respiro lateral da página). As bordas avisam quando há mais
// pôsteres escondidos, com as mesmas setinhas dos filtros.
export function PosterRail<T extends SeriesSearchResult>({
  label,
  items,
  onOpen,
  renderBadge,
  isRefreshing = false,
}: PosterRailProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);
  const edges = useScrollEdges(listRef);
  const tracked = useTrackedSeriesByTmdbId();

  return (
    <div className="relative -mx-4">
      <ul
        ref={listRef}
        aria-label={label}
        aria-busy={isRefreshing || undefined}
        className={cx(
          'flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 scrollbar-none transition-opacity duration-200',
          isRefreshing && 'opacity-50',
        )}
      >
        {items.map((series, index) => (
          <li key={series.tmdbId} className="shrink-0 snap-start">
            <PosterTile
              series={series}
              isTracked={tracked.has(series.tmdbId)}
              badge={renderBadge?.(series, index)}
              onOpen={() => onOpen(series)}
            />
          </li>
        ))}
      </ul>
      <ScrollEdge
        side="start"
        visible={edges.start}
        arrow="md"
        fade="sm"
        onPress={() => edges.scrollByPage(-1)}
      />
      <ScrollEdge
        side="end"
        visible={edges.end}
        arrow="md"
        fade="sm"
        onPress={() => edges.scrollByPage(1)}
      />
    </div>
  );
}

// O formato da fileira enquanto carrega: quatro pôsteres e as linhas do título.
export function PosterRailSkeleton() {
  return (
    <div aria-hidden className="-mx-4 flex gap-3 overflow-hidden px-4">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex w-28 shrink-0 flex-col gap-2 md:w-32">
          <Skeleton className="aspect-2/3 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

// A estante que não carregou: diz o quê e oferece de novo, sem ocupar o espaço da fileira.
export function PosterRailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2.5">
      <p className="text-sm text-fg-muted">Não deu para carregar agora.</p>
      <Button variant="ghost" size="sm" onClick={onRetry} className="-mr-1.5 shrink-0">
        Tentar de novo
      </Button>
    </div>
  );
}
