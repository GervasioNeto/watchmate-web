import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { useMarkEpisode } from '@/hooks/useEpisodeProgress';
import { useMe } from '@/hooks/useMe';
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
  const { data: me } = useMe();

  const current = getCurrentPosition(progress);
  const next = getNextEpisode(progress, series.temporadas);
  const seasonTotal = current ? getSeasonTotal(series.temporadas, current.season) : null;
  const percent = getSeriesProgressPercent(progress, series.temporadas) ?? 0;
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w185');

  const partner = me?.membroDoGrupo?.grupo.membros.find((member) => member.usuario.id !== me?.id);
  const addedByMe = !!series.adicionadoPor && series.adicionadoPor === me?.id;
  const addedByPartner =
    !!series.adicionadoPor && !!partner && series.adicionadoPor === partner.usuario.id;
  const adderName = addedByMe
    ? (me?.nome ?? me?.email ?? null)
    : addedByPartner
      ? (partner!.usuario.nome ?? partner!.usuario.email)
      : null;
  const adderLetter = adderName ? adderName[0]?.toUpperCase() : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-raised">
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/series/${series.id}`)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') navigate(`/series/${series.id}`);
        }}
        className="flex cursor-pointer gap-4 p-4 transition-colors active:bg-surface-border/60"
      >
        <div className="aspect-2/3 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
          {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-flame uppercase">
              Continue assistindo
            </p>
            {series.notaMedia != null && (
              <span className="shrink-0 text-xs font-semibold text-amber">
                ★ {series.notaMedia.toFixed(1)}
              </span>
            )}
          </div>

          <h3 className="truncate font-heading text-lg font-semibold text-white">{series.nome}</h3>

          <p className="font-mono text-xs text-neutral-300">
            {current
              ? `T${current.season} · Ep ${current.episode}${
                  seasonTotal ? ` de ${seasonTotal}` : ''
                }`
              : 'Ainda não começou'}
          </p>

          <div className="h-1.5 w-full max-w-52 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-flame transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          {adderLetter && (
            <div className="mt-0.5 flex items-center gap-1.5">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold text-white ${
                  addedByMe ? 'bg-ultramarine' : 'bg-fuchsia'
                }`}
              >
                {adderLetter}
              </div>
              <span className="truncate text-[11px] text-neutral-300">
                Adicionada por {adderName}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-surface-border p-3">
        <Button
          onClick={() =>
            markEpisode.mutate({ season: next.season, episode: next.episode, watched: true })
          }
          isLoading={markEpisode.isPending}
          className="w-full"
        >
          Marcar T{next.season} Ep{next.episode} como assistido
        </Button>
      </div>
    </div>
  );
}
