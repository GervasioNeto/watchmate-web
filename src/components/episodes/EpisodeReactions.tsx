import { EyeOff } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useCouple } from '@/hooks/useCouple';
import { useEpisodeReactions, useSetEpisodeReaction } from '@/hooks/useEpisodeReactions';
import { cx } from '@/lib/cx';
import { subjectName } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';
import { getReactionSummary } from '@/lib/reactionSummary';

const REACTION_EMOJIS = ['❤️', '😂', '😐', '😮', '😢', '🔥'];

interface EpisodeReactionsProps {
  seriesId: string;
  season: number;
  episode: number;
  enabled: boolean;
}

export function EpisodeReactions({ seriesId, season, episode, enabled }: EpisodeReactionsProps) {
  const { me, partner, byId } = useCouple();
  const { data: reactions = [] } = useEpisodeReactions(seriesId, season, episode, enabled);
  const setReaction = useSetEpisodeReaction(
    seriesId,
    season,
    episode,
    me ? { id: me.id, nome: me.name } : undefined,
  );

  const myReaction = reactions.find((entry) => entry.usuarioId === me?.id);
  const summary = me && partner ? getReactionSummary(reactions, me.id, partner.shortName) : null;

  return (
    <div className="flex flex-col gap-2.5">
      <h4 className="text-xs font-semibold text-fg-subtle">Reações</h4>

      <div className="flex flex-wrap gap-1" role="group" aria-label="Sua reação">
        {REACTION_EMOJIS.map((emoji) => {
          const selected = !myReaction?.oculto && myReaction?.emoji === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => setReaction.mutate(emoji)}
              disabled={setReaction.isPending}
              aria-label={`Reagir com ${emoji}`}
              aria-pressed={selected}
              className={cx(
                'flex h-10 w-10 items-center justify-center rounded-md text-lg transition-colors',
                selected
                  ? cx('bg-surface-2 ring-1', me && TONE_CLASSES[me.tone].ring)
                  : 'hover:bg-surface-2',
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {reactions.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {reactions.map((reaction) => {
            const person = byId(reaction.usuarioId);
            const name = person ? subjectName(person) : (reaction.usuario.nome ?? 'Alguém');
            return (
              <li key={reaction.id} className="flex items-center gap-2 text-sm">
                <Avatar person={person} size="xs" />
                <span className="font-semibold">{name}</span>
                {reaction.oculto ? (
                  <span className="flex items-center gap-1.5 text-fg-muted">
                    <EyeOff size={14} aria-hidden />
                    reagiu. Assista para ver.
                  </span>
                ) : (
                  <span className="text-base leading-none">{reaction.emoji}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {summary && <p className="text-sm text-fg-muted">{summary}</p>}
    </div>
  );
}
