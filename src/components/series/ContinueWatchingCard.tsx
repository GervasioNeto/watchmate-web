import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useCouple } from '@/hooks/useCouple';
import {
  affectsEpisode,
  usePendingProgressActions,
  useUpdateProgress,
} from '@/hooks/useSeriesProgress';
import { subjectName } from '@/lib/people';
import { formatEpisodeCode, getMember, getNextPosition } from '@/lib/progress';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { SeriesProgress, TrackedSeries } from '@/types/api';

interface ContinueWatchingCardProps {
  series: TrackedSeries;
  progress: SeriesProgress;
}

export function ContinueWatchingCard({ series, progress }: ContinueWatchingCardProps) {
  const { me, partner } = useCouple();
  const updateProgress = useUpdateProgress(series.id);
  const pending = usePendingProgressActions(series.id);

  if (!me) return null;

  const people = [me, partner].filter((person) => person !== null);
  const next = getNextPosition(getMember(progress, me.id)?.posicaoAtual ?? null, series.temporadas);
  const together = !!partner && series.modo === 'JUNTOS';
  const isNextPending =
    !!next && pending.some((action) => affectsEpisode(action, next.temporada, next.episodio));
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w185');

  return (
    <section aria-labelledby="continue-heading" className="flex flex-col gap-3">
      <h2 id="continue-heading" className="text-sm font-semibold text-fg-muted">
        Continuar
      </h2>
      <div className="flex flex-col gap-4 rounded-lg bg-surface p-4 sm:flex-row sm:items-center">
        <Link
          to={`/series/${series.id}`}
          className="flex min-w-0 flex-1 items-center gap-4 rounded-md"
        >
          <div className="aspect-2/3 w-16 shrink-0 overflow-hidden rounded-sm bg-surface-2">
            {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="truncate text-lg font-bold">{series.nome}</p>
            <ul className="flex flex-col gap-1">
              {people.map((person) => {
                const position = getMember(progress, person.id)?.posicaoAtual ?? null;
                return (
                  <li key={person.id} className="flex items-center gap-2 text-sm">
                    <Avatar person={person} size="xs" />
                    <span className="text-fg-muted">{subjectName(person)}</span>
                    <span className="text-fg-muted tabular-nums">
                      {position ? formatEpisodeCode(position) : 'não começou'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Link>

        {next && (
          <Button
            onClick={() =>
              updateProgress.mutate({
                kind: 'episode',
                season: next.temporada,
                episode: next.episodio,
                watched: true,
                scope: together ? 'both' : 'me',
              })
            }
            isLoading={isNextPending}
            className="w-full sm:w-auto"
          >
            {`${together ? 'Assistimos o' : 'Assisti o'} ${formatEpisodeCode(next)}`}
          </Button>
        )}
      </div>
    </section>
  );
}
