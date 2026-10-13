import { useMemo, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { EpisodeRow } from '@/components/episodes/EpisodeRow';
import { SeasonRetrospective } from '@/components/episodes/SeasonRetrospective';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useSeasonEpisodes } from '@/hooks/useSeasonEpisodes';
import {
  affectsEpisode,
  usePendingProgressActions,
  useUpdateProgress,
} from '@/hooks/useSeriesProgress';
import { cx } from '@/lib/cx';
import {
  getEpisodeChoices,
  getEpisodeQuickToggle,
  getSeasonChoices,
  getSeasonStatus,
} from '@/lib/episodeActions';
import {
  episodeKey,
  getEpisodeWatchStatus,
  getMember,
  getPlayableSeasons,
  getSeasonTotal,
  indexEpisodes,
} from '@/lib/progress';
import type { SeriesProgress, TrackedSeries } from '@/types/api';

interface EpisodesSectionProps {
  series: TrackedSeries;
  progress: SeriesProgress;
}

export function EpisodesSection({ series, progress }: EpisodesSectionProps) {
  const { me, partner } = useCouple();
  const updateProgress = useUpdateProgress(series.id);
  const pending = usePendingProgressActions(series.id);
  const episodeIndex = useMemo(() => indexEpisodes(progress), [progress]);

  const seasons = getPlayableSeasons(series.temporadas);
  const myPosition = me ? getMember(progress, me.id)?.posicaoAtual : null;
  const [seasonOverride, setSeasonOverride] = useState<number | null>(null);
  const season = seasonOverride ?? myPosition?.temporada ?? seasons[0]?.numero ?? 1;

  const { data: episodes, isLoading: isEpisodesLoading } = useSeasonEpisodes(series.id, season);

  if (!me) return null;

  const total = getSeasonTotal(series.temporadas, season) ?? 0;
  const context = { meId: me.id, partnerName: partner?.shortName ?? null, mode: series.modo };

  // A lista do TMDB pode ter episódios novos; sem ela, usamos o total salvo na série.
  const numbers =
    episodes && episodes.length > 0
      ? episodes.map((episode) => episode.numero)
      : Array.from({ length: total }, (_, index) => index + 1);
  const detailsByNumber = new Map(episodes?.map((episode) => [episode.numero, episode]));

  const seasonStatus = getSeasonStatus(progress, season, total, me.id, partner?.id ?? null);
  const seasonChoices = getSeasonChoices(seasonStatus, context);
  const isSeasonPending = pending.some(
    (action) =>
      action.kind === 'catch-up' || (action.kind !== 'episode' && action.season === season),
  );
  const bothFinishedSeason =
    !!partner && total > 0 && seasonStatus.mine >= total && seasonStatus.partners >= total;

  return (
    <section aria-labelledby="episodes-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="episodes-heading" className="text-lg font-bold">
          Episódios
        </h2>
        {seasonChoices.length > 0 && (
          <ActionSheet
            title={`Temporada ${season}`}
            description={
              partner
                ? `Você viu ${seasonStatus.mine} de ${total}, ${partner.shortName} viu ${seasonStatus.partners}.`
                : `Você viu ${seasonStatus.mine} de ${total}.`
            }
            items={seasonChoices.map((choice) => ({
              key: `${choice.scope}-${choice.watched}`,
              label: choice.label,
              destructive: choice.destructive,
              onSelect: () =>
                updateProgress.mutate({
                  kind: 'season',
                  season,
                  watched: choice.watched,
                  scope: choice.scope,
                }),
            }))}
            renderTrigger={(triggerProps) => (
              <Button {...triggerProps} variant="ghost" size="sm" isLoading={isSeasonPending}>
                Temporada inteira
                <Ellipsis size={16} aria-hidden />
              </Button>
            )}
          />
        )}
      </div>

      {seasons.length > 1 && (
        <div
          role="group"
          aria-label="Temporada"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
        >
          {seasons.map((entry) => {
            const selected = entry.numero === season;
            return (
              <button
                key={entry.numero}
                type="button"
                aria-pressed={selected}
                onClick={() => setSeasonOverride(entry.numero)}
                className={cx(
                  'min-h-9 shrink-0 rounded-md px-3 text-sm font-semibold transition-colors',
                  selected ? 'bg-fg text-canvas' : 'bg-surface-2 text-fg-muted hover:text-fg',
                )}
              >
                {entry.numero === 0 ? 'Especiais' : `T${entry.numero}`}
              </button>
            );
          })}
        </div>
      )}

      {updateProgress.isError && (
        <p role="alert" className="text-sm text-danger">
          Não foi possível salvar. Tente de novo.
        </p>
      )}

      {bothFinishedSeason && <SeasonRetrospective seriesId={series.id} season={season} />}

      {isEpisodesLoading ? (
        <ul aria-label="Carregando episódios" className="flex flex-col">
          {[0, 1, 2].map((index) => (
            <li key={index} className="flex gap-3 border-b border-line py-3 last:border-b-0">
              <Skeleton className="aspect-video w-24 shrink-0 rounded-sm sm:w-32" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3 w-12 rounded-sm" />
                <Skeleton className="h-4 w-3/4 rounded-sm" />
              </div>
            </li>
          ))}
        </ul>
      ) : numbers.length === 0 ? (
        <p className="text-sm text-fg-subtle">Nenhum episódio nessa temporada.</p>
      ) : (
        <ul className="flex flex-col">
          {numbers.map((number) => {
            const status = getEpisodeWatchStatus(
              episodeIndex.get(episodeKey(season, number)),
              me.id,
              partner?.id ?? null,
            );
            return (
              <EpisodeRow
                key={number}
                seriesId={series.id}
                season={season}
                number={number}
                details={detailsByNumber.get(number)}
                status={status}
                toggle={getEpisodeQuickToggle(status, context)}
                choices={getEpisodeChoices(status, context)}
                me={me}
                partner={partner}
                canMark={number >= 1 && number <= total}
                isPending={pending.some((action) => affectsEpisode(action, season, number))}
                onChange={({ watched, scope }) =>
                  updateProgress.mutate({
                    kind: 'episode',
                    season,
                    episode: number,
                    watched,
                    scope,
                  })
                }
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
