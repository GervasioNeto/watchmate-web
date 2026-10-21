import { useId, useState, type FormEvent } from 'react';
import { ArrowUp, LoaderCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import {
  useAddEpisodeComment,
  useDeleteEpisodeComment,
  useEpisodeComments,
} from '@/hooks/useEpisodeComments';
import { cx } from '@/lib/cx';
import { formatTimeAgo } from '@/lib/dates';
import { subjectName, type Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';
import type { EpisodeComment } from '@/types/api';

// O limite só evita um texto sem fim: comentário de episódio é conversa, não resenha.
const MAX_COMMENT_LENGTH = 500;

interface EpisodeIdProps {
  seriesId: string;
  season: number;
  episode: number;
}

// A conversa de vocês sobre o episódio, em balões como os recados: os seus à direita, na
// sua cor; os do par à esquerda, com o avatar. O que é spoiler para você aparece borrado.
export function EpisodeConversation({ seriesId, season, episode }: EpisodeIdProps) {
  const titleId = useId();
  const { me, byId } = useCouple();
  const { data: comments, isLoading } = useEpisodeComments(seriesId, season, episode);
  const deleteComment = useDeleteEpisodeComment(seriesId, season, episode);

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h3 id={titleId} className="text-sm font-bold">
        Conversa
      </h3>

      {isLoading ? (
        <div aria-label="Carregando a conversa" className="flex flex-col gap-3">
          <Skeleton className="h-10 w-3/5 rounded-lg" />
          <Skeleton className="h-10 w-2/5 self-end rounded-lg" />
        </div>
      ) : comments && comments.length > 0 ? (
        <ol className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              person={byId(comment.usuarioId)}
              isMine={comment.usuarioId === me?.id}
              isDeleting={deleteComment.isPending && deleteComment.variables === comment.id}
              onDelete={() => deleteComment.mutate(comment.id)}
            />
          ))}
        </ol>
      ) : (
        <p className="text-sm text-fg-subtle">
          Ninguém comentou ainda. Deixe a primeira impressão aqui embaixo.
        </p>
      )}
    </section>
  );
}

interface CommentBubbleProps {
  comment: EpisodeComment;
  person: Person | null;
  isMine: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}

function CommentBubble({ comment, person, isMine, isDeleting, onDelete }: CommentBubbleProps) {
  const name = isMine ? 'Você' : person ? subjectName(person) : (comment.usuario.nome ?? 'Alguém');
  const time = formatTimeAgo(new Date(comment.criadoEm), new Date());

  return (
    <li className={cx('flex items-end gap-2', isMine && 'flex-row-reverse')}>
      {!isMine && <Avatar person={person} size="xs" className="mb-5" />}
      <div
        className={cx(
          'flex max-w-[82%] min-w-0 flex-col gap-1',
          isMine ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cx(
            'rounded-lg px-3 py-2 text-sm leading-snug wrap-break-word',
            isMine
              ? cx('rounded-br-sm', person ? TONE_CLASSES[person.tone].soft : 'bg-surface-2')
              : 'rounded-bl-sm bg-surface-2 text-fg',
          )}
        >
          {comment.oculto ? (
            <>
              {/* Um borrão no lugar do texto, e o aviso por cima dele, legível. */}
              <span aria-hidden className="block blur-[5px] select-none">
                Esse comentário aparece quando você vir o episódio
              </span>
              <span className="mt-1 block text-xs font-semibold text-fg-muted">
                🙈 Assista para ver
              </span>
            </>
          ) : (
            comment.texto
          )}
        </div>
        <span className="flex items-center gap-2 px-1 text-[11px] text-fg-subtle">
          <span>
            {name} · {time}
          </span>
          {isMine && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded-sm font-semibold hover:text-danger disabled:opacity-50"
            >
              {isDeleting ? 'Apagando…' : 'Apagar'}
            </button>
          )}
        </span>
      </div>
    </li>
  );
}

// O campo de escrever, fixo no rodapé da folha (como num app de mensagem): o botão de
// enviar fica dentro dele e só acende com algo escrito.
export function CommentComposer({ seriesId, season, episode }: EpisodeIdProps) {
  const addComment = useAddEpisodeComment(seriesId, season, episode);
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !addComment.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment.mutate(trimmed, { onSuccess: () => setText('') });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pr-1 pl-4 focus-within:outline-2 focus-within:outline-accent">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          enterKeyHint="send"
          placeholder="Comente o episódio…"
          aria-label="Comentar o episódio"
          className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none sm:text-sm"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Enviar comentário"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-[background-color,scale] active:scale-90 disabled:bg-line disabled:text-fg-subtle"
        >
          {addComment.isPending ? (
            <LoaderCircle size={16} aria-hidden className="animate-spin" />
          ) : (
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden />
          )}
        </button>
      </div>
      {addComment.isError && (
        <p role="alert" className="px-2 text-xs text-danger">
          Não foi possível enviar. Tente de novo.
        </p>
      )}
    </form>
  );
}
