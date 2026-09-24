import { useEpisodeReactions, useSetEpisodeReaction } from '@/hooks/useEpisodeReactions';
import { useMe } from '@/hooks/useMe';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface EpisodeReactionsProps {
  seriesId: string;
  season: number;
  episode: number;
  enabled: boolean;
}

export function EpisodeReactions({ seriesId, season, episode, enabled }: EpisodeReactionsProps) {
  const { data: me } = useMe();
  const { data: reactions = [] } = useEpisodeReactions(seriesId, season, episode, enabled);
  const setReaction = useSetEpisodeReaction(
    seriesId,
    season,
    episode,
    me ? { id: me.id, nome: me.nome } : undefined,
  );

  const myReaction = reactions.find((entry) => entry.usuario.id === me?.id);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-fit gap-1 rounded-full bg-surface p-1">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setReaction.mutate(emoji)}
            disabled={setReaction.isPending}
            aria-label={`Reagir com ${emoji}`}
            aria-pressed={myReaction?.emoji === emoji}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all active:scale-90 ${
              myReaction?.emoji === emoji
                ? 'scale-110 bg-flame/20 ring-1 ring-flame'
                : 'hover:bg-surface-border'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {reactions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {reactions.map((reaction) => {
            const isMe = reaction.usuario.id === me?.id;
            const letter = (reaction.usuario.nome ?? '?')[0]?.toUpperCase() ?? '?';
            return (
              <span
                key={reaction.usuario.id}
                title={reaction.usuario.nome ?? undefined}
                className="flex items-center gap-1.5 rounded-full bg-surface py-1 pr-2.5 pl-1 text-sm text-neutral-300"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
                    isMe ? 'bg-ultramarine' : 'bg-fuchsia'
                  }`}
                >
                  {letter}
                </span>
                {reaction.emoji}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
