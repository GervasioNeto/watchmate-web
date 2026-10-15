import { LibrarySection, SeriesGrid, ToStartSection } from '@/components/series/LibrarySection';
import { WatchedSeriesSection } from '@/components/series/WatchedSeriesSection';
import { Button } from '@/components/ui/Button';
import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup';
import { useCouple } from '@/hooks/useCouple';
import { useListFilters } from '@/hooks/useListFilters';
import { groupBySection, orderFinished, type ListSection } from '@/lib/listOrder';
import {
  countByProgress,
  presentKinds,
  splitEntries,
  type KindFilter,
  type ListEntry,
  type ProgressFilter,
} from '@/lib/seriesFilters';

const KIND_LABELS: Record<KindFilter, string> = {
  all: 'Tudo',
  series: 'Séries',
  anime: 'Animes',
  animation: 'Animações',
};

const SECTION_LABELS: Record<ListSection, string> = {
  watching: 'Assistindo',
  waiting: 'Esperando episódio',
  'to-start': 'Para começar',
};

interface SeriesLibraryProps {
  entries: ListEntry[];
  // Enquanto o progresso de alguma série carrega, as contagens ficam escondidas.
  isProgressLoading: boolean;
}

// A lista de séries: em cima, as em aberto com os filtros (por progresso e por tipo);
// no fim, recolhidas, as que vocês já terminaram.
export function SeriesLibrary({ entries, isProgressLoading }: SeriesLibraryProps) {
  const { me, partner } = useCouple();
  const filters = useListFilters();
  const context = { meId: me?.id ?? '', partnerId: partner?.id ?? null };

  // "Em andamento" e não "Assistindo": o filtro junta os blocos "Assistindo" e
  // "Esperando episódio", e o mesmo nome com contagens diferentes confundiria.
  const progressLabels: Record<ProgressFilter, string> = {
    all: 'Todas',
    watching: 'Em andamento',
    'not-started': 'Para começar',
    'partner-ahead': partner ? `${partner.shortName} está à frente` : 'À frente',
  };

  const counts =
    me && !isProgressLoading
      ? countByProgress(
          entries,
          ['all', 'watching', 'not-started', 'partner-ahead'],
          filters.kind,
          context,
        )
      : null;

  // "Leila está à frente" só aparece quando tem alguma série nessa situação.
  const progressFilters: ProgressFilter[] = ['all', 'watching', 'not-started'];
  if (partner && ((counts?.['partner-ahead'] ?? 0) > 0 || filters.progress === 'partner-ahead')) {
    progressFilters.push('partner-ahead');
  }

  // O filtro de tipo só aparece se a lista (em aberto + assistidas) tiver mais de um tipo.
  const kinds = presentKinds(entries);
  const kindFilters: KindFilter[] = ['all', ...kinds];
  if (filters.kind !== 'all' && !kinds.includes(filters.kind)) kindFilters.push(filters.kind);
  const showKinds = kindFilters.length > 2;

  const { open, finished } = me
    ? splitEntries(entries, filters.progress, filters.kind, context)
    : { open: entries, finished: [] };

  // A ordem só é montada com todo o progresso carregado: o progresso chega série a série,
  // e reordenar a cada resposta faria os cards pularem. Até lá, a ordem em que entraram.
  const groups = me && !isProgressLoading ? groupBySection(open, me, partner, new Date()) : null;
  // Os títulos dos blocos só em "Todas": nos outros filtros a lista já é um recorte.
  const showSections = groups !== null && filters.progress === 'all';
  const ordered = groups ? groups.flatMap((group) => group.entries) : open;

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
          label="Filtrar séries em aberto"
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
        {open.length === 1 ? '1 série em aberto' : `${open.length} séries em aberto`}
      </p>

      {open.length > 0 ? (
        showSections ? (
          <div className="flex flex-col gap-8">
            {groups.map((group) =>
              group.section === 'to-start' ? (
                <ToStartSection
                  key={group.section}
                  title={SECTION_LABELS[group.section]}
                  entries={group.entries}
                />
              ) : (
                <LibrarySection
                  key={group.section}
                  title={SECTION_LABELS[group.section]}
                  entries={group.entries}
                />
              ),
            )}
          </div>
        ) : (
          <SeriesGrid entries={ordered} />
        )
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-line p-5">
          <p className="text-sm text-fg-muted">
            {emptyMessage(filters.progress, filters.kind, partner?.shortName ?? null)}
          </p>
          {filters.isFiltered && (
            <Button variant="secondary" size="sm" onClick={filters.clearFilters}>
              Ver todas
            </Button>
          )}
        </div>
      )}

      {finished.length > 0 && (
        <WatchedSeriesSection
          entries={orderFinished(finished)}
          isOpen={filters.isArchiveOpen}
          onOpenChange={filters.setArchiveOpen}
        />
      )}
    </section>
  );
}

function emptyMessage(
  progress: ProgressFilter,
  kind: KindFilter,
  partnerName: string | null,
): string {
  if (kind !== 'all') return 'Nenhuma série em aberto com esses filtros.';
  switch (progress) {
    case 'all':
      return 'Nenhuma série em aberto. Tudo o que vocês adicionaram já foi assistido.';
    case 'watching':
      return 'Nenhuma série em andamento.';
    case 'not-started':
      return 'Vocês já começaram todas as séries da lista.';
    case 'partner-ahead':
      return `${partnerName ?? 'Seu par'} não está à frente em nenhuma série.`;
  }
}
