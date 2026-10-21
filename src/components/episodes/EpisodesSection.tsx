import { useMemo, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { EpisodeRow, type EpisodeSocial } from '@/components/episodes/EpisodeRow';
import { EpisodeSheet, type EpisodeSheetEpisode } from '@/components/episodes/EpisodeSheet';
import { SeasonLegend, SeasonMeter } from '@/components/episodes/SeasonMarks';
import { SeasonRetrospective } from '@/components/episodes/SeasonRetrospective';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useSeasonCommentCounts } from '@/hooks/useEpisodeComments';
import { useSeasonEpisodes } from '@/hooks/useSeasonEpisodes';
import { useSeasonReactions } from '@/hooks/useSeasonReactions';
import {
  affectsEpisode,
  usePendingProgressActions,
  useUpdateProgress,
} from '@/hooks/useSeriesProgress';
import { formatUpcomingDay } from '@/lib/dates';
import {
  getEpisodeChoices,
  getEpisodeQuickToggle,
  getSeasonChoices,
  getSeasonStatus,
  type ProgressChange,
} from '@/lib/episodeActions';
import { countMarksBySeason, EMPTY_SEASON_MARKS, getEpisodeMarkKind } from '@/lib/episodeMark';
import {
  episodeKey,
  formatEpisodeCode,
  getEpisodeWatchStatus,
  getMember,
  getNextPosition,
  getPlayableSeasons,
  getSeasonTotal,
  indexEpisodes,
} from '@/lib/progress';
import { tmdbStillUrl } from '@/lib/tmdb';
import type { EpisodeReaction, SeasonEpisode, SeriesProgress, TrackedSeries } from '@/types/api';

interface EpisodesSectionProps {
  series: TrackedSeries;
  progress: SeriesProgress;
}

const NO_SOCIAL: EpisodeSocial = { myReaction: null, partnerReaction: null, comments: 0 };

// A linha tem pouco espaço ao lado da imagem: só a duração ("62 min"). A folha mostra a
// data também ("24 de jul. de 2019 · 62 min"). O que ainda não saiu: "Estreia sexta".
function formatEpisodeMeta(details: SeasonEpisode | undefined, now: Date) {
  if (!details) return { short: null, full: null };
  const airDate = details.dataExibicao ? new Date(details.dataExibicao) : null;
  if (airDate && airDate > now) {
    const premiere = `Estreia ${formatUpcomingDay(airDate, now)}`;
    return { short: premiere, full: premiere };
  }
  const runtime = details.duracaoMinutos ? `${details.duracaoMinutos} min` : null;
  const date = airDate?.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return { short: runtime, full: [date, runtime].filter(Boolean).join(' · ') || null };
}

type EpisodeView = EpisodeSheetEpisode & { shortMeta: string | null; stillUrl: string | null };

// O que a linha mostra das reações sem abrir o episódio. A do par chega escondida da API
// enquanto é spoiler para você: aí só aparece que ela existe.
function indexSocial(
  reactions: EpisodeReaction[] | undefined,
  commentCounts: Map<number, number>,
  meId: string,
  partnerId: string | null,
): Map<number, EpisodeSocial> {
  const social = new Map<number, EpisodeSocial>();
  const entry = (episode: number) => {
    const current = social.get(episode) ?? {
      ...NO_SOCIAL,
      comments: commentCounts.get(episode) ?? 0,
    };
    social.set(episode, current);
    return current;
  };

  for (const [episode] of commentCounts) entry(episode);
  for (const reaction of reactions ?? []) {
    if (reaction.usuarioId === meId) {
      entry(reaction.episodio).myReaction = reaction.oculto ? null : reaction.emoji;
    } else if (reaction.usuarioId === partnerId) {
      entry(reaction.episodio).partnerReaction = {
        emoji: reaction.oculto ? null : reaction.emoji,
      };
    }
  }
  return social;
}

export function EpisodesSection({ series, progress }: EpisodesSectionProps) {
  const { me, partner } = useCouple();
  const updateProgress = useUpdateProgress(series.id);
  const pending = usePendingProgressActions(series.id);
  const episodeIndex = useMemo(() => indexEpisodes(progress), [progress]);
  const marksBySeason = useMemo(
    () => (me ? countMarksBySeason(progress, me.id, partner?.id ?? null) : null),
    [progress, me, partner],
  );

  const seasons = getPlayableSeasons(series.temporadas);
  const myPosition = me ? (getMember(progress, me.id)?.posicaoAtual ?? null) : null;
  const [seasonOverride, setSeasonOverride] = useState<number | null>(null);
  const season = seasonOverride ?? myPosition?.temporada ?? seasons[0]?.numero ?? 1;

  // O episódio aberto na folha e quem a abriu (para o foco voltar para a linha).
  const [openNumber, setOpenNumber] = useState<number | null>(null);
  const [sheetTrigger, setSheetTrigger] = useState<HTMLElement | null>(null);
  // Imagens de episódios não vistos que você pediu para mostrar: valem na lista e na folha.
  const [revealedStills, setRevealedStills] = useState<ReadonlySet<string>>(() => new Set());

  const { data: episodes, isLoading: isEpisodesLoading } = useSeasonEpisodes(series.id, season);
  const { data: reactions } = useSeasonReactions(series.id, season);
  const { data: commentCounts } = useSeasonCommentCounts(series.id, season);

  const social = useMemo(
    () =>
      me
        ? indexSocial(
            reactions,
            new Map(commentCounts?.map((row) => [row.episodio, row.total])),
            me.id,
            partner?.id ?? null,
          )
        : new Map<number, EpisodeSocial>(),
    [reactions, commentCounts, me, partner],
  );

  if (!me || !marksBySeason) return null;

  const meId = me.id;
  const partnerId = partner?.id ?? null;
  const total = getSeasonTotal(series.temporadas, season) ?? 0;
  const context = { meId, partnerName: partner?.shortName ?? null };
  const now = new Date();

  // A lista do TMDB pode ter episódios novos; sem ela, usamos o total salvo na série.
  const numbers =
    episodes && episodes.length > 0
      ? episodes.map((episode) => episode.numero)
      : Array.from({ length: total }, (_, index) => index + 1);
  const detailsByNumber = new Map(episodes?.map((episode) => [episode.numero, episode]));

  // O próximo que você tem para ver, se ele cai nessa temporada.
  const next = getNextPosition(myPosition, series.temporadas);
  const nextNumber = next?.temporada === season ? next.episodio : null;

  const seasonStatus = getSeasonStatus(progress, season, total, meId, partnerId);
  const seasonChoices = getSeasonChoices(seasonStatus, context);
  const isSeasonPending = pending.some(
    (action) =>
      action.kind === 'catch-up' || (action.kind !== 'episode' && action.season === season),
  );
  const bothFinishedSeason =
    !!partner && total > 0 && seasonStatus.mine >= total && seasonStatus.partners >= total;

  function describeEpisode(number: number): EpisodeView {
    const key = episodeKey(season, number);
    const details = detailsByNumber.get(number);
    const status = getEpisodeWatchStatus(episodeIndex.get(key), meId, partnerId);
    const meta = formatEpisodeMeta(details, now);
    return {
      number,
      code: formatEpisodeCode({ temporada: season, episodio: number }),
      title: details?.titulo ?? `Episódio ${number}`,
      meta: meta.full,
      shortMeta: meta.short,
      details,
      stillUrl: tmdbStillUrl(details?.imagem ?? null),
      status,
      mark: getEpisodeMarkKind(status),
      isStillHidden: !status.me && !revealedStills.has(key),
      choices: getEpisodeChoices(status, context),
      canMark: number >= 1 && number <= total,
      isPending: pending.some((action) => affectsEpisode(action, season, number)),
    };
  }

  function changeEpisode(number: number, change: ProgressChange) {
    updateProgress.mutate({ kind: 'episode', season, episode: number, ...change });
  }

  function revealStill(number: number) {
    setRevealedStills((current) => new Set(current).add(episodeKey(season, number)));
  }

  const openEpisode = openNumber !== null ? describeEpisode(openNumber) : null;

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
              key: choice.label,
              label: choice.label,
              destructive: choice.destructive,
              onSelect: () =>
                updateProgress.mutate({
                  kind: 'season',
                  season,
                  watched: choice.watched,
                  scope: choice.scope,
                  together: choice.together,
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
        <ChipGroup
          label="Temporada"
          options={seasons.map((entry) => ({
            value: String(entry.numero),
            label: entry.numero === 0 ? 'Especiais' : `T${entry.numero}`,
            indicator: (selected) => (
              <SeasonMeter
                counts={marksBySeason.get(entry.numero) ?? EMPTY_SEASON_MARKS}
                total={getSeasonTotal(series.temporadas, entry.numero) ?? 0}
                me={me}
                partner={partner}
                selected={selected}
              />
            ),
          }))}
          value={String(season)}
          onChange={(value) => setSeasonOverride(Number(value))}
          bleed
        />
      )}

      <SeasonLegend
        counts={marksBySeason.get(season) ?? EMPTY_SEASON_MARKS}
        total={total}
        me={me}
        partner={partner}
      />

      {updateProgress.isError && (
        <p role="alert" className="text-sm text-danger">
          Não foi possível salvar. Tente de novo.
        </p>
      )}

      {bothFinishedSeason && <SeasonRetrospective seriesId={series.id} season={season} />}

      {isEpisodesLoading ? (
        <ul aria-label="Carregando episódios" className="flex flex-col">
          {[0, 1, 2].map((index) => (
            <li
              key={index}
              className="flex items-start gap-3 border-b border-line py-3 last:border-b-0"
            >
              <Skeleton className="aspect-video w-32 shrink-0 rounded-md sm:w-40" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-1/3 rounded-sm" />
                <Skeleton className="h-4 w-3/4 rounded-sm" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <Skeleton className="mx-2 h-7 w-7 shrink-0 rounded-full" />
            </li>
          ))}
        </ul>
      ) : numbers.length === 0 ? (
        <p className="text-sm text-fg-subtle">Nenhum episódio nessa temporada.</p>
      ) : (
        <ul className="flex flex-col">
          {numbers.map((number) => {
            const episode = describeEpisode(number);
            const toggle = getEpisodeQuickToggle(episode.status);
            return (
              <EpisodeRow
                key={number}
                code={episode.code}
                number={number}
                title={episode.title}
                meta={episode.shortMeta}
                stillUrl={episode.stillUrl}
                isStillHidden={episode.isStillHidden}
                onRevealStill={() => revealStill(number)}
                mark={episode.mark}
                me={me}
                partner={partner}
                isNext={number === nextNumber && !episode.status.me}
                social={social.get(number) ?? NO_SOCIAL}
                checked={toggle.checked}
                canMark={episode.canMark}
                isPending={episode.isPending}
                onToggle={() => changeEpisode(number, { watched: toggle.watched, scope: 'me' })}
                onOpen={(trigger) => {
                  setSheetTrigger(trigger);
                  setOpenNumber(number);
                }}
              />
            );
          })}
        </ul>
      )}

      <EpisodeSheet
        seriesId={series.id}
        season={season}
        episode={openEpisode}
        me={me}
        partner={partner}
        onChange={changeEpisode}
        onRevealStill={revealStill}
        onClose={() => setOpenNumber(null)}
        returnFocusTo={sheetTrigger}
      />
    </section>
  );
}
