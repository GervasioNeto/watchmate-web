import { useNavigate } from 'react-router-dom';
import { useEpisodeProgress } from '@/hooks/useEpisodeProgress';
import { useMe } from '@/hooks/useMe';
import { tmdbPosterUrl } from '@/lib/tmdb';
import { getSeriesProgressPercent } from '@/lib/progress';
import type { TrackedSeries } from '@/types/api';

const PLACEHOLDER_ACCENTS = ['bg-ultramarine', 'bg-raspberry', 'bg-amber', 'bg-flame'];

export function SeriesCard({ series }: { series: TrackedSeries }) {
  const navigate = useNavigate();
  const { data: progress = [] } = useEpisodeProgress(series.id);
  const { data: me } = useMe();

  const percent = getSeriesProgressPercent(progress, series.temporadas) ?? 0;
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w185');
  const accent = PLACEHOLDER_ACCENTS[series.tmdbId % PLACEHOLDER_ACCENTS.length];

  const partner = me?.membroDoGrupo?.grupo.membros.find((member) => member.usuario.id !== me?.id);
  const addedByMe = !!series.adicionadoPor && series.adicionadoPor === me?.id;
  const addedByPartner = !!series.adicionadoPor && !!partner && series.adicionadoPor === partner.usuario.id;
  const adderName = addedByMe
    ? (me?.nome ?? me?.email ?? null)
    : addedByPartner
      ? (partner!.usuario.nome ?? partner!.usuario.email)
      : null;
  const adderLetter = adderName ? adderName[0]?.toUpperCase() : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/series/${series.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') navigate(`/series/${series.id}`);
      }}
      className="group relative aspect-2/3 cursor-pointer overflow-hidden rounded-xl bg-surface-raised transition-transform active:scale-[0.97]"
    >
      {posterUrl ? (
        <img src={posterUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className={`flex h-full w-full items-center justify-center ${accent}`}>
          <span className="font-heading text-3xl font-semibold text-white/90">
            {series.nome[0]?.toUpperCase()}
          </span>
        </div>
      )}

      {series.notaMedia != null && (
        <div className="absolute top-1.5 right-1.5 rounded-full bg-surface/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber backdrop-blur">
          ★ {series.notaMedia.toFixed(1)}
        </div>
      )}

      {adderLetter && (
        <div
          title={`Adicionada por ${adderName}`}
          className={`absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-1 ring-black/20 ${
            addedByMe ? 'bg-ultramarine' : 'bg-fuchsia'
          }`}
        >
          {adderLetter}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pt-8 pb-2">
        <p className="truncate text-xs font-semibold text-white">{series.nome}</p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-flame" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}
