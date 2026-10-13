import { ChevronDown } from 'lucide-react';
import { SERIES_GRID } from '@/components/series/seriesGrid';
import { SeriesCard } from '@/components/series/SeriesCard';
import type { ListEntry } from '@/lib/seriesFilters';

interface WatchedSeriesSectionProps {
  entries: ListEntry[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Histórico das séries que vocês terminaram, recolhido no fim da lista. Usa <details>
// nativo (teclado e leitor de tela de graça). Os cards só são montados quando a seção
// está aberta, então um histórico grande não pesa enquanto está fechado.
export function WatchedSeriesSection({ entries, isOpen, onOpenChange }: WatchedSeriesSectionProps) {
  return (
    <details
      open={isOpen}
      onToggle={(event) => {
        const open = event.currentTarget.open;
        if (open !== isOpen) onOpenChange(open);
      }}
      className="group border-t border-line"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-md [&::-webkit-details-marker]:hidden">
        <span className="flex items-baseline gap-2">
          <span className="text-base font-bold">Assistidas</span>
          <span className="text-sm text-fg-muted tabular-nums">{entries.length}</span>
        </span>
        <ChevronDown
          size={22}
          strokeWidth={2.5}
          aria-hidden
          className="shrink-0 text-fg-muted transition-transform group-open:rotate-180"
        />
      </summary>

      {isOpen && (
        <div className={SERIES_GRID}>
          {entries.map((entry) => (
            <SeriesCard key={entry.series.id} series={entry.series} progress={entry.progress} />
          ))}
        </div>
      )}
    </details>
  );
}
