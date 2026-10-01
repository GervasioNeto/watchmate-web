import { useMe } from '@/hooks/useMe';
import { useSeasonReactions } from '@/hooks/useSeasonReactions';
import { getSharedReactionMoments } from '@/lib/seasonRetrospective';

interface SeasonRetrospectiveProps {
  seriesId: string;
  season: number;
  enabled: boolean;
}

export function SeasonRetrospective({ seriesId, season, enabled }: SeasonRetrospectiveProps) {
  const { data: me } = useMe();
  const { data: reactions, isLoading } = useSeasonReactions(seriesId, season, enabled);

  if (!enabled) return null;

  const moments = me && reactions ? getSharedReactionMoments(reactions, me.id) : [];

  return (
    <div className="mx-4 mt-5 rounded-2xl border border-surface-border bg-surface-raised p-4">
      <h2 className="font-heading text-base font-semibold text-white">Nossa temporada juntos</h2>
      <p className="mt-0.5 text-xs text-neutral-500">Temporada {season} · concluída</p>

      {isLoading ? (
        <p className="mt-3 text-xs text-neutral-500">Montando a retrospectiva…</p>
      ) : moments.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {moments.map((moment) => (
            <li key={moment.emoji} className="flex items-center gap-2.5 text-sm text-neutral-200">
              <span className="text-lg">{moment.emoji}</span>
              {moment.phrase}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">
          Vocês ainda não reagiram junto a nenhum episódio dessa temporada.
        </p>
      )}
    </div>
  );
}
