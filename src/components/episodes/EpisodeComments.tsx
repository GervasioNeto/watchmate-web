import { useState, type FormEvent } from 'react';
import { EyeOff, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextInput } from '@/components/ui/TextInput';
import { useCouple } from '@/hooks/useCouple';
import {
  useAddEpisodeComment,
  useDeleteEpisodeComment,
  useEpisodeComments,
} from '@/hooks/useEpisodeComments';
import { subjectName } from '@/lib/people';

interface EpisodeCommentsProps {
  seriesId: string;
  season: number;
  episode: number;
  enabled: boolean;
}

function formatRelativeTime(iso: string) {
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  return `${Math.round(diffHours / 24)} d`;
}

export function EpisodeComments({ seriesId, season, episode, enabled }: EpisodeCommentsProps) {
  const { me, byId } = useCouple();
  const { data: comments, isLoading } = useEpisodeComments(seriesId, season, episode, enabled);
  const addComment = useAddEpisodeComment(seriesId, season, episode);
  const deleteComment = useDeleteEpisodeComment(seriesId, season, episode);
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment.mutate(trimmed, { onSuccess: () => setText('') });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <h4 className="text-xs font-semibold text-fg-subtle">Comentários</h4>

      {isLoading ? (
        <div className="flex flex-col gap-3" aria-label="Carregando comentários">
          {[0, 1].map((index) => (
            <div key={index} className="flex items-start gap-2">
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-24 rounded-sm" />
                <Skeleton className="h-3 w-full max-w-52 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line">
          {comments.map((comment) => {
            const person = byId(comment.usuarioId);
            const name = person ? subjectName(person) : (comment.usuario.nome ?? 'Alguém');
            const isMine = comment.usuarioId === me?.id;
            return (
              <li key={comment.id} className="flex items-start gap-2 py-2.5 first:pt-0">
                <Avatar person={person} size="xs" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-semibold text-fg">{name}</span>
                    <span className="text-fg-subtle">
                      {' '}
                      · {formatRelativeTime(comment.criadoEm)}
                    </span>
                  </p>
                  {comment.oculto ? (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-fg-muted">
                      <EyeOff size={14} aria-hidden />
                      Comentário escondido até você ver o episódio.
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm break-words text-fg">{comment.texto}</p>
                  )}
                </div>
                {isMine && (
                  <IconButton
                    size="sm"
                    aria-label="Apagar comentário"
                    onClick={() => deleteComment.mutate(comment.id)}
                    disabled={deleteComment.isPending}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-fg-subtle">Nenhum comentário ainda.</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <TextInput
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escreva um comentário"
          aria-label="Escreva um comentário"
          className="flex-1"
        />
        <Button
          type="submit"
          variant="secondary"
          isLoading={addComment.isPending}
          disabled={!text.trim()}
        >
          Enviar
        </Button>
      </form>
      {addComment.isError && (
        <p role="alert" className="text-sm text-danger">
          Não foi possível enviar o comentário.
        </p>
      )}
    </div>
  );
}
