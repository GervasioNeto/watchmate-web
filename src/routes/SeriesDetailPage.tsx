import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { EpisodeCard } from '@/components/EpisodeCard';
import { useEpisodeProgress, useMarkEpisode } from '@/hooks/useEpisodeProgress';
import { useGroup } from '@/hooks/useGroup';
import { useMe } from '@/hooks/useMe';
import { useSeasonEpisodes } from '@/hooks/useSeasonEpisodes';
import { useDeleteSeries, useSeries } from '@/hooks/useSeries';
import {
  getCurrentPosition,
  getNextEpisode,
  getSeasonTotal,
  getSeriesProgressPercent,
  getSeriesTotalEpisodes,
  getWatchedCount,
} from '@/lib/progress';
import { tmdbBackdropUrl, tmdbPosterUrl } from '@/lib/tmdb';
import type { EpisodeProgress } from '@/types/api';

const STATUS_LABELS: Record<string, string> = {
  'Returning Series': 'Em exibição',
  Ended: 'Finalizada',
  Canceled: 'Cancelada',
  'In Production': 'Em produção',
  Planned: 'Planejada',
  Pilot: 'Piloto',
};

const GENRE_ACCENTS = [
  'border-ultramarine/40 bg-ultramarine/10 text-ultramarine',
  'border-raspberry/40 bg-raspberry/10 text-raspberry',
  'border-amber/40 bg-amber/10 text-amber',
  'border-flame/40 bg-flame/10 text-flame',
];

export function SeriesDetailPage() {
  const { seriesId = '' } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();

  const { data: allSeries } = useSeries();
  const series = allSeries?.find((item) => item.id === seriesId);

  const { data: me } = useMe();
  const { data: group } = useGroup();
  const { data: progress = [], isLoading: isProgressLoading } = useEpisodeProgress(seriesId);
  const markEpisode = useMarkEpisode(seriesId);
  const deleteSeries = useDeleteSeries();

  const current = getCurrentPosition(progress);

  const [seasonOverride, setSeasonOverride] = useState<number | null>(null);
  const selectedSeason = seasonOverride ?? current?.season ?? 1;

  const { data: seasonEpisodes, isLoading: isSeasonEpisodesLoading } = useSeasonEpisodes(
    seriesId,
    selectedSeason,
  );

  const [manualEpisode, setManualEpisode] = useState('');

  const partnerId = group?.membros.find((member) => member.usuarioId !== me?.id)?.usuarioId;

  function markedByLabel(marcadoPor: string | null) {
    if (!marcadoPor) return null;
    if (marcadoPor === me?.id) return 'marcado por Você';
    if (marcadoPor === partnerId) return 'marcado por seu par';
    return null;
  }

  function handleDelete() {
    if (!series) return;
    if (!window.confirm(`Remover "${series.nome}" da lista? Isso apaga o progresso salvo.`)) return;
    deleteSeries.mutate(series.id, {
      onSuccess: () => navigate('/my-list'),
    });
  }

  if (!series) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-neutral-400">Série não encontrada.</p>
        <Button variant="secondary" onClick={() => navigate('/my-list')}>
          Voltar pra Minha Lista
        </Button>
      </div>
    );
  }

  const next = getNextEpisode(progress, series.temporadas);
  const currentSeasonTotal = current ? getSeasonTotal(series.temporadas, current.season) : null;
  const seriesTotal = getSeriesTotalEpisodes(series.temporadas);
  const watchedCount = getWatchedCount(progress);
  const seriesPercent = getSeriesProgressPercent(progress, series.temporadas);

  const seasonTotal = getSeasonTotal(series.temporadas, selectedSeason);
  const seasonProgressMap = new Map<number, EpisodeProgress>(
    progress
      .filter((entry) => entry.temporada === selectedSeason)
      .map((entry) => [entry.episodio, entry]),
  );
  const episodeNumbers = seasonTotal
    ? Array.from({ length: seasonTotal }, (_, index) => index + 1)
    : Array.from(seasonProgressMap.keys()).sort((a, b) => a - b);
  const watchedInSeason = Array.from(seasonProgressMap.values()).filter(
    (entry) => entry.assistidoEm,
  ).length;

  const posterUrl = tmdbPosterUrl(series.posterPath, 'w342');
  const backdropUrl = tmdbBackdropUrl(series.backdropPath);
  const year = series.primeiraExibicaoEm ? new Date(series.primeiraExibicaoEm).getFullYear() : null;
  const statusLabel = series.status ? (STATUS_LABELS[series.status] ?? series.status) : null;
  const subtitleParts = [series.englishName, series.nomeOriginal].filter(
    (value, index, all): value is string => !!value && value !== series.nome && all.indexOf(value) === index,
  );

  return (
    <div className="min-h-svh pb-16">
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <div className="relative aspect-video max-h-96 w-full overflow-hidden bg-surface-raised">
            {backdropUrl && (
              <img src={backdropUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface/70 text-lg text-white backdrop-blur"
          >
            ←
          </button>

          {series.notaMedia != null && (
            <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-surface/70 px-3 py-1 text-sm font-semibold text-amber backdrop-blur">
              ★ {series.notaMedia.toFixed(1)}
            </div>
          )}
        </div>

        <div className="relative -mt-14 flex gap-4 px-4">
          <div className="aspect-2/3 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-black bg-surface-raised shadow-lg">
            {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-end pb-1">
            <h1 className="truncate font-heading text-xl font-semibold text-white">
              {series.nome}
            </h1>
            {subtitleParts.length > 0 && (
              <p className="truncate text-xs text-neutral-500">{subtitleParts.join(' · ')}</p>
            )}
          </div>
        </div>

        {(year || statusLabel) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 px-4 text-xs text-neutral-400">
            {year && <span>{year}</span>}
            {year && statusLabel && <span>·</span>}
            {statusLabel && <span>{statusLabel}</span>}
          </div>
        )}

        {series.generos && series.generos.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {series.generos.map((genero, index) => (
              <span
                key={genero}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                  GENRE_ACCENTS[index % GENRE_ACCENTS.length]
                }`}
              >
                {genero}
              </span>
            ))}
          </div>
        )}

        {series.sinopse && (
          <p className="mt-3 px-4 text-sm leading-relaxed text-neutral-300">{series.sinopse}</p>
        )}

        <div className="mx-4 mt-5 rounded-2xl border border-surface-border bg-surface-raised p-4">
          <p className="text-sm text-neutral-400">
            {current
              ? `Vocês estão em T${current.season} · Ep ${current.episode}${
                  currentSeasonTotal ? ` de ${currentSeasonTotal}` : ''
                }`
              : 'Vocês ainda não começaram'}
          </p>

          {seriesTotal > 0 && (
            <div className="mt-2">
              <p className="text-xs text-neutral-500">
                {watchedCount} de {seriesTotal} episódios · {seriesPercent}%
              </p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-flame transition-all"
                  style={{ width: `${seriesPercent ?? 0}%` }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={() =>
              markEpisode.mutate({ season: next.season, episode: next.episode, watched: true })
            }
            isLoading={markEpisode.isPending}
            className="mt-3 w-full sm:w-auto"
          >
            Marcar T{next.season} Ep{next.episode} como assistido
          </Button>
        </div>

        <div className="mt-6 px-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm text-neutral-400">
              Temporada{seasonTotal ? ` (${watchedInSeason}/${seasonTotal})` : ''}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSeasonOverride(Math.max(1, selectedSeason - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised text-white"
              >
                –
              </button>
              <span className="w-8 text-center font-mono text-white">{selectedSeason}</span>
              <button
                type="button"
                onClick={() => setSeasonOverride(selectedSeason + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised text-white"
              >
                +
              </button>
            </div>
          </div>

          {isSeasonEpisodesLoading || isProgressLoading ? (
            <p className="text-sm text-neutral-500">Carregando episódios…</p>
          ) : seasonEpisodes && seasonEpisodes.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {seasonEpisodes.map((episode) => (
                <EpisodeCard
                  key={episode.numero}
                  episode={episode}
                  progress={seasonProgressMap.get(episode.numero)}
                  markedByLabel={markedByLabel}
                  isPending={markEpisode.isPending}
                  onToggleWatched={() =>
                    markEpisode.mutate({
                      season: selectedSeason,
                      episode: episode.numero,
                      watched: !seasonProgressMap.get(episode.numero)?.assistidoEm,
                    })
                  }
                />
              ))}
            </ul>
          ) : episodeNumbers.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum episódio marcado nessa temporada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {episodeNumbers.map((episodeNumber) => {
                const entry = seasonProgressMap.get(episodeNumber);
                const watched = !!entry?.assistidoEm;
                const label = watched ? markedByLabel(entry!.marcadoPor) : null;
                return (
                  <li
                    key={episodeNumber}
                    className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-raised px-4 py-3"
                  >
                    <div>
                      <p className="font-mono text-sm text-white">Episódio {episodeNumber}</p>
                      {label && <p className="text-xs text-neutral-500">{label}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        markEpisode.mutate({
                          season: selectedSeason,
                          episode: episodeNumber,
                          watched: !watched,
                        })
                      }
                      aria-pressed={watched}
                      aria-label={
                        watched
                          ? `Desmarcar episódio ${episodeNumber}`
                          : `Marcar episódio ${episodeNumber} como assistido`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        watched ? 'border-flame bg-flame text-white' : 'border-surface-border text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Só existe quando não sabemos o total da temporada — se soubermos,
              a lista acima já cobre todo número de episódio válido. */}
          {!seasonTotal && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const episodeNumber = Number(manualEpisode);
                if (Number.isInteger(episodeNumber) && episodeNumber > 0) {
                  markEpisode.mutate({ season: selectedSeason, episode: episodeNumber, watched: true });
                  setManualEpisode('');
                }
              }}
              className="mt-4 flex gap-2"
            >
              <input
                type="number"
                min={1}
                value={manualEpisode}
                onChange={(event) => setManualEpisode(event.target.value)}
                placeholder="Nº do episódio"
                className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-white outline-none focus:border-flame"
              />
              <Button type="submit" variant="secondary">
                Marcar
              </Button>
            </form>
          )}

          <div className="mt-8 border-t border-surface-border pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteSeries.isPending}
              className="text-sm text-fuchsia hover:text-fuchsia/80 disabled:opacity-50"
            >
              {deleteSeries.isPending ? 'Removendo…' : 'Remover série da lista'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
