import { useNavigate } from 'react-router-dom';
import { useMarkEpisode } from '@/hooks/useEpisodeProgress';
import {
  getCurrentPosition,
  getNextEpisode,
  getSeasonTotal,
  getSeriesProgressPercent,
} from '@/lib/progress';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { EpisodeProgress, TrackedSeries } from '@/types/api';

interface ContinueWatchingCardProps {
  series: TrackedSeries;
  progress: EpisodeProgress[];
}

export function ContinueWatchingCard({ series, progress }: ContinueWatchingCardProps) {
  const navigate = useNavigate();
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
      className="flex cursor-pointer gap-4 rounded-2xl border border-surface-border bg-surface-raised p-4 transition-colors active:bg-surface-border/60"
    >
      <div className="aspect-2/3 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
        {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <p className="text-xs font-semibold tracking-wide text-flame uppercase">
          Continue assistindo
        </p>
        <h3 className="truncate font-heading text-lg font-semibold text-white">{series.nome}</h3>
        <p className="font-mono text-xs text-neutral-400">
          {current
            ? `T${current.season} · Ep ${current.episode}${
                seasonTotal ? ` de ${seasonTotal}` : ''
              }`
            : 'Ainda não começou'}
        </p>
        <div className="mt-1 h-1.5 w-full max-w-52 overflow-hidden rounded-full bg-surface">
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
