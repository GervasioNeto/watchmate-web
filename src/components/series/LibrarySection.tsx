import { useId, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dices } from 'lucide-react';
import { SERIES_GRID } from '@/components/series/seriesGrid';
import { SeriesCard } from '@/components/series/SeriesCard';
import { Button } from '@/components/ui/Button';
import { useCouple } from '@/hooks/useCouple';
import { useSeriesDraw } from '@/hooks/useSeriesDraw';
import { cx } from '@/lib/cx';
import { getDrawPool } from '@/lib/seriesDraw';
import type { ListEntry } from '@/lib/seriesFilters';

interface SeriesGridProps {
  entries: ListEntry[];
  // O card aceso pela roleta do sorteio.
  highlightedId?: string | null;
}

export function SeriesGrid({ entries, highlightedId = null }: SeriesGridProps) {
  return (
    <div className={SERIES_GRID}>
      {entries.map((entry) => (
        <SeriesCard
          key={entry.series.id}
          series={entry.series}
          progress={entry.progress}
          highlighted={entry.series.id === highlightedId}
        />
      ))}
    </div>
  );
}

interface LibrarySectionProps extends SeriesGridProps {
  title: string;
  // Um botão no canto do título (o sorteio de "Para começar").
  action?: ReactNode;
}

// Um bloco da lista com o título e quantas séries tem, no mesmo estilo de "Assistidas".
export function LibrarySection({ title, entries, action, highlightedId }: LibrarySectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h3 id={headingId} className="flex shrink-0 items-baseline gap-2">
          <span className="text-base font-bold">{title}</span>
          <span className="text-sm text-fg-muted tabular-nums">{entries.length}</span>
        </h3>
        {action}
      </div>
      <SeriesGrid entries={entries} highlightedId={highlightedId} />
    </section>
  );
}

// "Para começar", com o sorteio quando há de onde sortear (ver getDrawPool). A roleta
// acende os cards um a um até parar na sorteada, e aí abre a série.
export function ToStartSection({ title, entries }: { title: string; entries: ListEntry[] }) {
  const navigate = useNavigate();
  const { partner } = useCouple();
  const draw = useSeriesDraw();
  const pool = getDrawPool(entries, new Date());

  const winner = entries.find((entry) => entry.series.id === draw.winnerId);
  const label = winner
    ? `Deu ${winner.series.nome}!`
    : draw.isDrawing
      ? 'Sorteando…'
      : partner
        ? 'Sorteia pra gente'
        : 'Sorteia uma';

  const action = pool.length > 0 && (
    <>
      {/* aria-disabled em vez de disabled: o resultado não fica apagado e o foco não se perde. */}
      <Button
        variant="secondary"
        size="sm"
        aria-disabled={draw.isDrawing || undefined}
        onClick={() =>
          draw.start(
            pool.map((entry) => entry.series.id),
            (seriesId) => navigate(`/series/${seriesId}`),
          )
        }
        className="min-w-0"
      >
        <Dices
          size={16}
          aria-hidden
          className={cx('shrink-0', draw.isDrawing && !winner && 'animate-spin')}
        />
        <span className="truncate">{label}</span>
      </Button>
      <span className="sr-only" aria-live="polite">
        {draw.isDrawing ? label : ''}
      </span>
    </>
  );

  return (
    <LibrarySection
      title={title}
      entries={entries}
      action={action}
      highlightedId={draw.highlightedId}
    />
  );
}
