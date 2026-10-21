import { useState, type ReactNode } from 'react';
import { EyeOff, LoaderCircle } from 'lucide-react';
import { CommentComposer, EpisodeConversation } from '@/components/episodes/EpisodeConversation';
import { MarkDot, WatchBar } from '@/components/episodes/EpisodeMark';
import { ReactionDuet } from '@/components/episodes/ReactionDuet';
import { Synopsis } from '@/components/series/Synopsis';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { cx } from '@/lib/cx';
import type { ProgressChange, ProgressChoice } from '@/lib/episodeActions';
import { describeEpisodeWatch, type EpisodeMarkKind } from '@/lib/episodeMark';
import type { Person } from '@/lib/people';
import type { EpisodeWatchStatus } from '@/lib/progress';
import { tmdbStillUrl } from '@/lib/tmdb';
import type { SeasonEpisode } from '@/types/api';

export interface EpisodeSheetEpisode {
  number: number;
  code: string;
  title: string;
  meta: string | null;
  details: SeasonEpisode | undefined;
  status: EpisodeWatchStatus;
  mark: EpisodeMarkKind;
  // Você não viu e ainda não pediu para mostrar (na lista ou aqui).
  isStillHidden: boolean;
  choices: ProgressChoice[];
  canMark: boolean;
  isPending: boolean;
}

interface EpisodeSheetProps {
  seriesId: string;
  season: number;
  // O episódio aberto; null fecha a folha.
  episode: EpisodeSheetEpisode | null;
  me: Person;
  partner: Person | null;
  onChange: (number: number, change: ProgressChange) => void;
  onRevealStill: (number: number) => void;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}

// A "sala" de um episódio: o que ele é, quem de vocês viu e quando, as reações de cada um
// e a conversa, com o campo de comentar fixo embaixo. Imagem e sinopse de um episódio que
// você ainda não viu ficam escondidas, como as reações do par: o app não dá spoiler, nem
// vindo do TMDB.
export function EpisodeSheet({
  seriesId,
  season,
  episode,
  me,
  partner,
  onChange,
  onRevealStill,
  onClose,
  returnFocusTo,
}: EpisodeSheetProps) {
  return (
    <Sheet
      open={episode !== null}
      onClose={onClose}
      title={episode?.title ?? ''}
      description={episode ? [episode.code, episode.meta].filter(Boolean).join(' · ') : undefined}
      returnFocusTo={returnFocusTo}
      footer={
        episode && <CommentComposer seriesId={seriesId} season={season} episode={episode.number} />
      }
    >
      {episode && (
        <EpisodeSheetBody
          seriesId={seriesId}
          season={season}
          episode={episode}
          me={me}
          partner={partner}
          onChange={(change) => onChange(episode.number, change)}
          onRevealStill={() => onRevealStill(episode.number)}
        />
      )}
    </Sheet>
  );
}

interface EpisodeSheetBodyProps {
  seriesId: string;
  season: number;
  episode: EpisodeSheetEpisode;
  me: Person;
  partner: Person | null;
  onChange: (change: ProgressChange) => void;
  onRevealStill: () => void;
}

function EpisodeSheetBody({
  seriesId,
  season,
  episode,
  me,
  partner,
  onChange,
  onRevealStill,
}: EpisodeSheetBodyProps) {
  // A sinopse volta a esconder a cada abertura: a folha monta o conteúdo só enquanto está
  // aberta. A imagem segue a lista (mostrou lá, aparece aqui).
  const [showSynopsis, setShowSynopsis] = useState(false);
  const hasSeen = episode.status.me !== null;
  const stillUrl = tmdbStillUrl(episode.details?.imagem ?? null, 'original');
  const synopsis = episode.details?.resumo ?? null;

  return (
    <div className="flex flex-col gap-6 pb-2">
      {stillUrl && (
        <EpisodeStill url={stillUrl} isHidden={episode.isStillHidden} onReveal={onRevealStill}>
          <WatchBar kind={episode.mark} me={me} partner={partner} className="h-1.5" />
        </EpisodeStill>
      )}

      <WatchPanel episode={episode} me={me} partner={partner} onChange={onChange} />

      {synopsis &&
        (hasSeen || showSynopsis ? (
          <Synopsis text={synopsis} />
        ) : (
          <SpoilerNote
            title="Sinopse escondida"
            detail="Ela pode adiantar o que acontece no episódio."
            action="Mostrar a sinopse"
            onReveal={() => setShowSynopsis(true)}
          />
        ))}

      <ReactionDuet seriesId={seriesId} season={season} episode={episode.number} />
      <EpisodeConversation seriesId={seriesId} season={season} episode={episode.number} />
    </div>
  );
}

// Quem viu e quando, com a cor da marca, e as marcações que fazem sentido agora. O
// "Assistimos juntos" vem no laranja: é o "juntos" virando ação. Desmarcar fica discreto,
// numa linha à parte: corrige um engano, não é o que se quer fazer aqui.
function WatchPanel({
  episode,
  me,
  partner,
  onChange,
}: {
  episode: EpisodeSheetEpisode;
  me: Person;
  partner: Person | null;
  onChange: (change: ProgressChange) => void;
}) {
  const marks = episode.choices.filter((choice) => !choice.destructive);
  const unmarks = episode.choices.filter((choice) => choice.destructive);
  const apply = (choice: ProgressChoice) =>
    onChange({ watched: choice.watched, scope: choice.scope, together: choice.together });

  return (
    <section
      aria-label="Quem viu"
      className="flex flex-col gap-3 rounded-lg border border-line p-3"
    >
      <div className="flex items-center gap-2.5">
        <MarkDot kind={episode.mark} me={me} partner={partner} className="h-2.5 w-2.5" />
        <p className="min-w-0 flex-1 text-sm font-semibold">
          {describeEpisodeWatch(episode.status, partner)}
        </p>
        {episode.isPending && (
          <LoaderCircle size={16} aria-label="Salvando" className="shrink-0 animate-spin" />
        )}
      </div>

      {episode.canMark ? (
        <>
          {marks.length > 0 && (
            // Lado a lado, do mesmo tamanho: a escolha é entre as duas, nenhuma é a "principal"
            // por tamanho (o laranja já diz qual é o juntos).
            <div className={cx('grid gap-2', marks.length > 1 && 'grid-cols-2')}>
              {marks.map((choice) => (
                <Button
                  key={choice.label}
                  size="sm"
                  variant={choice.together ? 'primary' : 'secondary'}
                  disabled={episode.isPending}
                  onClick={() => apply(choice)}
                >
                  {choice.label}
                </Button>
              ))}
            </div>
          )}
          {unmarks.length > 0 && (
            <div className="-my-1 flex flex-wrap gap-x-4">
              {unmarks.map((choice) => (
                <button
                  key={choice.label}
                  type="button"
                  disabled={episode.isPending}
                  onClick={() => apply(choice)}
                  className="min-h-8 rounded-sm text-xs font-semibold text-fg-subtle transition-colors hover:text-danger disabled:opacity-50"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-fg-muted">
          Saiu depois que a série entrou na lista e ainda não pode ser marcado.
        </p>
      )}
    </section>
  );
}

// A imagem do episódio. Sem você ter visto, borrada, com o aviso por cima: um toque mostra.
function EpisodeStill({
  url,
  isHidden,
  onReveal,
  children,
}: {
  url: string;
  isHidden: boolean;
  onReveal: () => void;
  // A barra de quem viu, na base da imagem.
  children?: ReactNode;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
      <img
        src={url}
        alt=""
        className={cx(
          'h-full w-full object-cover transition-[filter,scale] duration-300',
          isHidden && 'scale-110 blur-xl',
        )}
      />
      {isHidden && (
        <button
          type="button"
          onClick={onReveal}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-canvas/35 px-6 text-center"
        >
          <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-canvas/55 backdrop-blur-sm">
            <EyeOff size={18} strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-sm font-bold">Imagem escondida</span>
          <span className="text-xs text-fg-muted">Você ainda não viu. Toque para mostrar.</span>
        </button>
      )}
      {children}
    </div>
  );
}

function SpoilerNote({
  title,
  detail,
  action,
  onReveal,
}: {
  title: string;
  detail: string;
  action: string;
  onReveal: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-line p-3">
      <EyeOff size={18} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
      <div className="flex min-w-0 flex-col items-start gap-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-fg-muted">{detail}</p>
        <button
          type="button"
          onClick={onReveal}
          className="mt-1 rounded-sm text-sm font-semibold text-fg underline-offset-4 hover:underline"
        >
          {action}
        </button>
      </div>
    </div>
  );
}
