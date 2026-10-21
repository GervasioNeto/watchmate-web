import { useId } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useCouple } from '@/hooks/useCouple';
import { useEpisodeReactions, useSetEpisodeReaction } from '@/hooks/useEpisodeReactions';
import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';
import { getReactionSummary } from '@/lib/reactionSummary';
import type { EpisodeReaction } from '@/types/api';

const REACTION_EMOJIS = ['❤️', '😂', '😐', '😮', '😢', '🔥'];

interface ReactionDuetProps {
  seriesId: string;
  season: number;
  episode: number;
}

// As reações do episódio como um dueto: o seu lugar e o do par, lado a lado, cada um na
// sua cor. Reagiram igual: os dois lugares ganham o laranja do "juntos". A do par fica
// escondida enquanto você não viu o episódio. Embaixo, os emojis para escolher (ou trocar)
// a sua.
export function ReactionDuet({ seriesId, season, episode }: ReactionDuetProps) {
  const titleId = useId();
  const { me, partner } = useCouple();
  const { data: reactions = [] } = useEpisodeReactions(seriesId, season, episode);
  const setReaction = useSetEpisodeReaction(
    seriesId,
    season,
    episode,
    me ? { id: me.id, nome: me.name } : undefined,
  );
  if (!me) return null;

  const mine = reactions.find((entry) => entry.usuarioId === me.id);
  const theirs = partner ? reactions.find((entry) => entry.usuarioId === partner.id) : undefined;
  const isSame =
    !!mine && !!theirs && !mine.oculto && !theirs.oculto && mine.emoji === theirs.emoji;
  const summary = partner ? getReactionSummary(reactions, me.id, partner.shortName) : null;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h3 id={titleId} className="text-sm font-bold">
        Reações
      </h3>

      <div className={cx('grid gap-2', partner && 'grid-cols-2')}>
        <ReactionSlot person={me} name="Você" reaction={mine} isSame={isSame} />
        {partner && (
          <ReactionSlot
            person={partner}
            name={partner.shortName}
            reaction={theirs}
            isSame={isSame}
          />
        )}
      </div>

      {summary && (
        <p className={cx('flex items-center gap-2 text-sm', isSame ? 'text-fg' : 'text-fg-muted')}>
          {isSame && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-together" />}
          {summary}
        </p>
      )}

      <div role="group" aria-label="Sua reação" className="flex gap-1 rounded-lg bg-surface-2 p-1">
        {REACTION_EMOJIS.map((emoji) => {
          const selected = !mine?.oculto && mine?.emoji === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => setReaction.mutate(emoji)}
              disabled={setReaction.isPending}
              aria-label={`Reagir com ${emoji}`}
              aria-pressed={selected}
              className={cx(
                'flex h-11 min-w-0 flex-1 items-center justify-center rounded-md text-xl transition-[background-color,scale] active:scale-90',
                selected
                  ? cx('bg-canvas ring-2 ring-inset', TONE_CLASSES[me.tone].ring)
                  : 'hover:bg-canvas/60',
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface ReactionSlotProps {
  person: Person;
  name: string;
  reaction: EpisodeReaction | undefined;
  isSame: boolean;
}

// O lugar de uma pessoa no dueto: o avatar e o nome, e a reação grande do outro lado, ou
// o que falta ("ainda não reagiu", "assista para ver").
function ReactionSlot({ person, name, reaction, isSame }: ReactionSlotProps) {
  const isHidden = reaction?.oculto === true;
  const emoji = reaction && !reaction.oculto ? reaction.emoji : null;

  return (
    <div
      className={cx(
        'flex min-h-16 items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2.5 transition-shadow',
        isSame
          ? 'ring-2 ring-together ring-inset'
          : emoji && cx('ring-1 ring-inset', TONE_CLASSES[person.tone].ring),
      )}
    >
      <Avatar person={person} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{name}</span>
        {!emoji && (
          <span className="truncate text-xs text-fg-subtle">
            {isHidden ? 'Assista para ver' : 'Ainda não reagiu'}
          </span>
        )}
      </div>
      {emoji && <span className="shrink-0 text-3xl leading-none">{emoji}</span>}
    </div>
  );
}
