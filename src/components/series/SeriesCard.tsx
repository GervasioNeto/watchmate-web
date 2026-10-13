import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useCouple } from '@/hooks/useCouple';
import { subjectName } from '@/lib/people';
import { getMember } from '@/lib/progress';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { SeriesProgress, TrackedSeries } from '@/types/api';

interface SeriesCardProps {
  series: TrackedSeries;
  progress: SeriesProgress | undefined;
}

export function SeriesCard({ series, progress }: SeriesCardProps) {
  const { me, partner, byId } = useCouple();
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w342');
  const addedBy = series.adicionadoPor ? byId(series.adicionadoPor) : null;
  const people = [me, partner].filter((person) => person !== null);

  return (
    <Link
      to={`/series/${series.id}`}
      className="group flex flex-col gap-2 rounded-md focus-visible:outline-offset-4"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-md bg-surface">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-opacity group-hover:opacity-85"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center p-3 text-center text-sm font-semibold text-fg-muted">
            {series.nome}
          </span>
        )}
        {addedBy && (
          <span className="absolute top-1.5 left-1.5" title={`Adicionada por ${addedBy.name}`}>
            <Avatar person={addedBy} size="xs" className="ring-2 ring-canvas" />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="truncate text-sm font-semibold">{series.nome}</p>
        {people.map((person) => (
          <ProgressBar
            key={person.id}
            value={progress ? (getMember(progress, person.id)?.percentual ?? 0) : 0}
            tone={person.role}
            label={`Progresso de ${subjectName(person)}`}
            size="sm"
          />
        ))}
      </div>
    </Link>
  );
}
