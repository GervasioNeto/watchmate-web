import { useNavigate } from 'react-router-dom';
import { useEpisodeProgress, useMarkEpisode } from '@/hooks/useEpisodeProgress';
import { tmdbPosterUrl } from '@/lib/tmdb';
import {
  getCurrentPosition,
  getNextEpisode,
  getSeasonTotal,
  getSeriesProgressPercent,
} from '@/lib/progress';
import type { TrackedSeries } from '@/types/api';

export function SeriesCard({ series }: { series: TrackedSeries }) {
  const navigate = useNavigate();
  const { data: progress = [] } = useEpisodeProgress(series.id);
  const markEpisode = useMarkEpisode(series.id);

  const current = getCurrentPosition(progress);
  const next = getNextEpisode(progress, series.temporadas);
  const seasonTotal = current ? getSeasonTotal(series.temporadas, current.season) : null;
  const percent = getSeriesProgressPercent(progress, series.temporadas) ?? 0;
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w185');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/series/${series.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') navigate(`/series/${series.id}`);
      }}
      className="flex cursor-pointer gap-3 rounded-2xl border border-surface-border bg-surface-raised p-3 transition-colors active:bg-surface-border/60"
    >
      <div className="aspect-2/3 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
        {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold text-white">
            {series.nome}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-neutral-400">
            {current
              ? `T${current.season} · Ep ${current.episode}${seasonTotal ? ` de ${seasonTotal}` : ''}`
              : 'Ainda não começou'}
          </p>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-flame transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          markEpisode.mutate({ season: next.season, episode: next.episode, watched: true });
        }}
        disabled={markEpisode.isPending}
        aria-label={`Marcar temporada ${next.season}, episódio ${next.episode} como assistido`}
        className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full bg-flame text-lg text-white transition-transform active:scale-90 disabled:opacity-50"
      >
        ✓
      </button>
    </div>
  );
}
