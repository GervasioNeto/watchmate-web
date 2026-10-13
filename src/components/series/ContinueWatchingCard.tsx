import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Play } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useCouple } from '@/hooks/useCouple';
import { subjectName } from '@/lib/people';
import { formatEpisodeCode, getMember, getNextPosition } from '@/lib/progress';
import { tmdbBackdropUrl, tmdbPosterUrl } from '@/lib/tmdb';
import type { SeriesProgress, TrackedSeries } from '@/types/api';

interface ContinueWatchingCardProps {
  series: TrackedSeries;
  progress: SeriesProgress;
}

// Atalho para a série em andamento mais recente. Não marca nada: marcar fica na página
// da série, onde dá para ver o que cada um já viu antes de decidir.
export function ContinueWatchingCard({ series, progress }: ContinueWatchingCardProps) {
  const { me, partner } = useCouple();
  const headingId = useId();

  if (!me) return null;

  const people = [me, partner].filter((person) => person !== null);
  const myMember = getMember(progress, me.id);
  const next = getNextPosition(myMember?.posicaoAtual ?? null, series.temporadas);
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w185');
  const backdropUrl = tmdbBackdropUrl(series.backdropPath);

  return (
    // O link do nome cobre o card inteiro (after:inset-0); o contorno de foco vai no card.
    <section
      aria-labelledby={headingId}
      className="group relative isolate overflow-hidden rounded-lg bg-surface has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent"
    >
      {backdropUrl && (
        <>
          <img
            src={backdropUrl}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-surface via-surface/85 to-surface/40"
          />
        </>
      )}

      <div className="flex flex-col gap-3 py-4 pr-12 pl-4">
        <h2
          id={headingId}
          className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted"
        >
          <Play size={11} aria-hidden className="fill-current" />
          Continuar assistindo
        </h2>

        <div className="flex items-center gap-4">
          <div className="aspect-2/3 w-16 shrink-0 overflow-hidden rounded-sm bg-surface-2">
            {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Link
              to={`/series/${series.id}`}
              className="line-clamp-2 text-lg leading-tight font-bold after:absolute after:inset-0 focus-visible:outline-none"
            >
              {series.nome}
            </Link>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
              {people.map((person) => {
                const position = getMember(progress, person.id)?.posicaoAtual ?? null;
                return (
                  <li key={person.id} className="flex items-center gap-1.5">
                    <Avatar person={person} size="xs" />
                    {subjectName(person)}
                    <span className="tabular-nums">
                      {position ? formatEpisodeCode(position) : 'não começou'}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-sm font-semibold">
              {next ? `Próximo: ${formatEpisodeCode(next)}` : 'Você chegou ao fim da série.'}
            </p>
          </div>
        </div>
      </div>

      {/* Centralizada no card inteiro. Sem pointer-events: o toque nela cai no link. */}
      <ChevronRight
        size={26}
        strokeWidth={2.5}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-fg-muted transition group-hover:translate-x-0.5 group-hover:text-fg"
      />
    </section>
  );
}
