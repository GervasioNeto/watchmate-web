import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { useEpisodeProgress, useMarkEpisode } from '@/hooks/useEpisodeProgress';
import { useGroup } from '@/hooks/useGroup';
import { useMe } from '@/hooks/useMe';
import { useSeries } from '@/hooks/useSeries';
import {
  getCurrentPosition,
  getNextEpisode,
  getSeasonTotal,
  getSeriesProgressPercent,
  getSeriesTotalEpisodes,
  getWatchedCount,
} from '@/lib/progress';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { EpisodeProgress } from '@/types/api';

export function SeriesDetailPage() {
  const { seriesId = '' } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();

  const { data: allSeries } = useSeries();
  const series = allSeries?.find((item) => item.id === seriesId);

  const { data: me } = useMe();
  const { data: group } = useGroup();
  const { data: progress = [], isLoading: isProgressLoading } = useEpisodeProgress(seriesId);
  const markEpisode = useMarkEpisode(seriesId);

  const current = getCurrentPosition(progress);

  const [seasonOverride, setSeasonOverride] = useState<number | null>(null);
  const selectedSeason = seasonOverride ?? current?.season ?? 1;

  const [manualEpisode, setManualEpisode] = useState('');

  const partnerId = group?.membros.find((member) => member.usuarioId !== me?.id)?.usuarioId;

  function markedByLabel(marcadoPor: string | null) {
    if (!marcadoPor) return null;
    if (marcadoPor === me?.id) return 'marcado por Você';
    if (marcadoPor === partnerId) return 'marcado por seu par';
    return null;
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

  return (
    <div className="min-h-svh pb-16">
      <header className="flex items-center gap-3 border-b border-surface-border px-4 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="text-xl text-neutral-400"
        >
          ←
        </button>
        <h1 className="truncate font-heading text-lg font-semibold text-white">{series.nome}</h1>
      </header>

      <div className="flex gap-4 p-4">
        <div className="aspect-2/3 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-raised">
          {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-col justify-center gap-2">
          <p className="text-sm text-neutral-400">
            {current
              ? `Vocês estão em T${current.season} · Ep ${current.episode}${
                  currentSeasonTotal ? ` de ${currentSeasonTotal}` : ''
                }`
              : 'Vocês ainda não começaram'}
          </p>

          {seriesTotal > 0 && (
            <div>
              <p className="text-xs text-neutral-500">
                {watchedCount} de {seriesTotal} episódios · {seriesPercent}%
              </p>
              <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-surface">
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
            className="mt-1 self-start"
          >
            Marcar T{next.season} Ep{next.episode} como assistido
          </Button>
        </div>
      </div>

      <div className="px-4">
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

        {isProgressLoading ? (
          <p className="text-sm text-neutral-500">Carregando episódios…</p>
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
      </div>
    </div>
  );
}
