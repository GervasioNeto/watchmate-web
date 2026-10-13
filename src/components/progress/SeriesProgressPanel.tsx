import { CoupleProgress, type CoupleProgressRow } from '@/components/progress/CoupleProgress';
import { WatchModeControl } from '@/components/progress/WatchModeControl';
import { Button } from '@/components/ui/Button';
import { useCouple } from '@/hooks/useCouple';
import {
  affectsEpisode,
  usePendingProgressActions,
  useUpdateProgress,
} from '@/hooks/useSeriesProgress';
import { describeCoupleGap, pluralEpisodes } from '@/lib/coupleSummary';
import { formatEpisodeCode, getMember, getNextPosition } from '@/lib/progress';
import type { ProgressScope, SeriesProgress, TrackedSeries } from '@/types/api';

interface SeriesProgressPanelProps {
  series: TrackedSeries;
  progress: SeriesProgress;
}

export function SeriesProgressPanel({ series, progress }: SeriesProgressPanelProps) {
  const { me, partner } = useCouple();
  const updateProgress = useUpdateProgress(series.id);
  const pending = usePendingProgressActions(series.id);

  if (!me) return null;

  const meMember = getMember(progress, me.id);
  const partnerMember = partner ? getMember(progress, partner.id) : null;

  const rows: CoupleProgressRow[] = [
    { person: me, position: meMember?.posicaoAtual ?? null, percent: meMember?.percentual ?? 0 },
  ];
  if (partner) {
    rows.push({
      person: partner,
      position: partnerMember?.posicaoAtual ?? null,
      percent: partnerMember?.percentual ?? 0,
    });
  }

  const next = getNextPosition(meMember?.posicaoAtual ?? null, series.temporadas);
  const primaryScope: ProgressScope = partner && series.modo === 'JUNTOS' ? 'both' : 'me';
  const secondaryScope: ProgressScope = primaryScope === 'both' ? 'me' : 'both';
  const isNextPending =
    !!next && pending.some((action) => affectsEpisode(action, next.temporada, next.episodio));

  const catchUpCount = partnerMember?.aFrente ?? 0;
  const isCatchUpPending = pending.some((action) => action.kind === 'catch-up');

  function markNext(scope: ProgressScope) {
    if (!next) return;
    updateProgress.mutate({
      kind: 'episode',
      season: next.temporada,
      episode: next.episodio,
      watched: true,
      scope,
    });
  }

  return (
    <CoupleProgress
      rows={rows}
      common={
        partner
          ? {
              position: progress.emComum.posicaoAtual,
              summary: describeCoupleGap(meMember, partnerMember, partner.shortName),
            }
          : undefined
      }
    >
      {partner && <WatchModeControl seriesId={series.id} mode={series.modo} />}

      {next ? (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => markNext(primaryScope)}
            isLoading={isNextPending}
            className="min-w-0 flex-1 sm:flex-none"
          >
            {`${primaryScope === 'both' ? 'Assistimos o' : 'Assisti o'} ${formatEpisodeCode(next)}`}
          </Button>
          {partner && (
            <Button
              variant="secondary"
              onClick={() => markNext(secondaryScope)}
              disabled={isNextPending}
            >
              {secondaryScope === 'me' ? 'Só eu' : 'Nós dois'}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-fg-muted">
          {meMember && meMember.assistidos > 0
            ? 'Você chegou ao fim da série.'
            : 'Essa série ainda não tem episódios.'}
        </p>
      )}

      {partner && catchUpCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-md border border-line px-3 py-2.5">
          <p className="min-w-0 text-sm text-fg-muted">
            {partner.shortName} viu {pluralEpisodes(catchUpCount)} que você ainda não viu.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateProgress.mutate({ kind: 'catch-up' })}
            isLoading={isCatchUpPending}
          >
            Já vi também
          </Button>
        </div>
      )}

      {updateProgress.isError && (
        <p role="alert" className="text-sm text-danger">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </CoupleProgress>
  );
}
