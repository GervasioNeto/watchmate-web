import { useCouple } from '@/hooks/useCouple';
import { useSeasonReactions } from '@/hooks/useSeasonReactions';
import { getSharedReactionMoments } from '@/lib/seasonRetrospective';

interface SeasonRetrospectiveProps {
  seriesId: string;
  season: number;
}

// Aparece quando os dois terminam a temporada: os momentos em que reagiram igual.
export function SeasonRetrospective({ seriesId, season }: SeasonRetrospectiveProps) {
  const { me } = useCouple();
  const { data: reactions, isLoading } = useSeasonReactions(seriesId, season);

  const moments = me && reactions ? getSharedReactionMoments(reactions, me.id) : [];

  return (
    <section className="rounded-lg border border-line p-4">
      <h3 className="text-base font-bold">Temporada {season} de vocês</h3>
      <p className="mt-0.5 text-sm text-fg-muted">Os dois terminaram essa temporada.</p>

      {isLoading ? (
        <p className="mt-3 text-sm text-fg-subtle">Montando a retrospectiva…</p>
      ) : moments.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {moments.map((moment) => (
            <li key={moment.emoji} className="flex items-center gap-2.5 text-sm">
              <span className="text-lg leading-none">{moment.emoji}</span>
              {moment.phrase}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-fg-subtle">
          Vocês ainda não reagiram igual a nenhum episódio dessa temporada.
        </p>
      )}
    </section>
  );
}
