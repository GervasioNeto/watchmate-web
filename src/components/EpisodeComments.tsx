import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import {
  useAddEpisodeComment,
  useDeleteEpisodeComment,
  useEpisodeComments,
} from '@/hooks/useEpisodeComments';
import { useMe } from '@/hooks/useMe';

interface EpisodeCommentsProps {
  seriesId: string;
  season: number;
  episode: number;
  enabled: boolean;
}

function formatRelativeTime(iso: string) {
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes}min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

export function EpisodeComments({ seriesId, season, episode, enabled }: EpisodeCommentsProps) {
  const { data: me } = useMe();
  const { data: comments, isLoading } = useEpisodeComments(
    seriesId,
    season,
    episode,
    enabled,
  );
  const addComment = useAddEpisodeComment(seriesId, season, episode);
  const deleteComment = useDeleteEpisodeComment(seriesId, season, episode);
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment.mutate(trimmed);
    setText('');
  }

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((index) => (
            <div key={index} className="flex items-start gap-2">
              <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-2.5 w-full max-w-52" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <ul className="flex flex-col">
          {comments.map((comment, index) => {
            const isMe = comment.usuario.id === me?.id;
            const displayName = isMe ? 'Você' : (comment.usuario.nome ?? 'Seu par');
            const letter = displayName[0]?.toUpperCase() ?? '?';
            return (
              <li
                key={comment.id}
                className={`flex items-start gap-2 py-2.5 ${
                  index > 0 ? 'border-t border-surface-border' : ''
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
                    isMe ? 'bg-ultramarine' : 'bg-fuchsia'
                  }`}
                >
                  {letter}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-white">{displayName}</span>
                    <span className="text-neutral-500">
                      · {formatRelativeTime(comment.criadoEm)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-300">
                    {comment.texto}
                  </p>
                </div>
                {isMe && (
                  <button
                    type="button"
                    onClick={() => deleteComment.mutate(comment.id)}
                    disabled={deleteComment.isPending}
                    aria-label="Apagar comentário"
                    className="shrink-0 p-1 text-neutral-600 transition-colors hover:text-fuchsia disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-neutral-500">Nenhum comentário ainda.</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escreva um comentário…"
          className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-flame"
        />
        <Button
          type="submit"
          variant="secondary"
          isLoading={addComment.isPending}
          className="px-3 py-2 text-xs"
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}
