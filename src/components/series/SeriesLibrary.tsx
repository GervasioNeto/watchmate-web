import { SeriesCard } from '@/components/series/SeriesCard';
import { Button } from '@/components/ui/Button';
import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup';
import { useCouple } from '@/hooks/useCouple';
import { useListFilters } from '@/hooks/useListFilters';
import {
  countByProgress,
  filterEntries,
  presentKinds,
  type KindFilter,
  type ListEntry,
  type ProgressFilter,
} from '@/lib/seriesFilters';

export const SERIES_GRID =
  'grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';

const KIND_LABELS: Record<KindFilter, string> = {
  all: 'Tudo',
  series: 'Séries',
  anime: 'Animes',
  animation: 'Animações',
};

interface SeriesLibraryProps {
  entries: ListEntry[];
  // Enquanto o progresso de alguma série carrega, as contagens ficam escondidas.
  isProgressLoading: boolean;
}

// A grade de séries com os filtros: por onde vocês estão (principal) e por tipo (discreto).
export function SeriesLibrary({ entries, isProgressLoading }: SeriesLibraryProps) {
  const { me, partner } = useCouple();
  const filters = useListFilters();
  const context = { meId: me?.id ?? '', partnerId: partner?.id ?? null };

  const progressLabels: Record<ProgressFilter, string> = {
    all: 'Todas',
    watching: 'Assistindo',
    'not-started': 'Para começar',
    finished: 'Assistidas',
    'partner-ahead': partner ? `${partner.shortName} está à frente` : 'À frente',
  };

  const counts =
    me && !isProgressLoading
      ? countByProgress(
          entries,
          ['all', 'watching', 'not-started', 'finished', 'partner-ahead'],
          filters.kind,
          context,
        )
      : null;

  // "Leila está à frente" só aparece quando tem alguma série nessa situação.
  const progressFilters: ProgressFilter[] = ['all', 'watching', 'not-started', 'finished'];
  if (partner && ((counts?.['partner-ahead'] ?? 0) > 0 || filters.progress === 'partner-ahead')) {
    progressFilters.push('partner-ahead');
  }

  // O filtro de tipo só aparece se a lista tiver mais de um tipo de série.
  const kinds = presentKinds(entries);
  const kindFilters: KindFilter[] = ['all', ...kinds];
  if (filters.kind !== 'all' && !kinds.includes(filters.kind)) kindFilters.push(filters.kind);
  const showKinds = kindFilters.length > 2;

  const visible = me ? filterEntries(entries, filters.progress, filters.kind, context) : entries;

  const progressOptions: ChipOption<ProgressFilter>[] = progressFilters.map((filter) => ({
    value: filter,
    label: progressLabels[filter],
    count: counts?.[filter],
  }));
  const kindOptions: ChipOption<KindFilter>[] = kindFilters.map((filter) => ({
    value: filter,
    label: KIND_LABELS[filter],
  }));

  return (
    <section aria-labelledby="library-heading" className="flex flex-col gap-4">
      <h2 id="library-heading" className="sr-only">
        Séries de vocês
      </h2>

      <div className="flex flex-col gap-2">
        <ChipGroup
          label="Filtrar por progresso"
          options={progressOptions}
          value={filters.progress}
          onChange={filters.setProgress}
          className="-mx-4 px-4"
        />
        {showKinds && (
          <ChipGroup
            label="Filtrar por tipo"
            size="sm"
            options={kindOptions}
            value={filters.kind}
            onChange={filters.setKind}
            className="-mx-4 px-4"
          />
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length === 1 ? '1 série' : `${visible.length} séries`}
      </p>

      {visible.length > 0 ? (
        <div className={SERIES_GRID}>
          {visible.map((entry) => (
            <SeriesCard key={entry.series.id} series={entry.series} progress={entry.progress} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-line p-5">
          <p className="text-sm text-fg-muted">
            {emptyMessage(filters.progress, filters.kind, partner?.shortName ?? null)}
          </p>
          <Button variant="secondary" size="sm" onClick={filters.clear}>
            Ver todas
          </Button>
        </div>
      )}
    </section>
  );
}

function emptyMessage(
  progress: ProgressFilter,
  kind: KindFilter,
  partnerName: string | null,
): string {
  if (kind !== 'all') return 'Nenhuma série com esses filtros.';
  switch (progress) {
    case 'watching':
      return 'Nenhuma série em andamento.';
    case 'not-started':
      return 'Vocês já começaram todas as séries da lista.';
    case 'finished':
      return 'Vocês ainda não assistiram nenhuma série até o fim.';
    case 'partner-ahead':
      return `${partnerName ?? 'Seu par'} não está à frente em nenhuma série.`;
    default:
      return 'Nenhuma série com esses filtros.';
  }
}
