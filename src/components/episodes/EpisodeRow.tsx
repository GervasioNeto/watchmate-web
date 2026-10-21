import { Check, ChevronRight, EyeOff, LoaderCircle, MessageCircle } from 'lucide-react';
import { Fragment } from 'react';
import { WatchBar } from '@/components/episodes/EpisodeMark';
import { cx } from '@/lib/cx';
import { markLabel, type EpisodeMarkKind } from '@/lib/episodeMark';
import type { Person } from '@/lib/people';

// O que já aconteceu entre vocês no episódio, para a linha mostrar sem abrir: a reação de
// cada um (a do par escondida, se você ainda não viu) e quantos comentários há.
export interface EpisodeSocial {
  myReaction: string | null;
  // null: o par não reagiu. `emoji` null: reagiu, mas é spoiler para você.
  partnerReaction: { emoji: string | null } | null;
  comments: number;
}

interface EpisodeRowProps {
  code: string;
  number: number;
  title: string;
  // Curto, para caber ao lado da imagem: a duração ("62 min") ou a estreia ("Estreia sexta").
  meta: string | null;
  stillUrl: string | null;
  // A imagem de um episódio que você não viu chega borrada; um toque mostra.
  isStillHidden: boolean;
  onRevealStill: () => void;
  mark: EpisodeMarkKind;
  me: Person;
  partner: Person | null;
  isNext: boolean;
  social: EpisodeSocial;
  // O check é sempre seu: "eu vi". Quem viu junto se resolve na folha do episódio.
  checked: boolean;
  canMark: boolean;
  isPending: boolean;
  onToggle: () => void;
  onOpen: (trigger: HTMLElement) => void;
}

// Uma linha da lista de episódios, no formato que os apps de streaming firmaram: a imagem
// do episódio à esquerda, com a barra de "visto" embaixo (aqui, nas cores de quem viu), e o
// título ao lado. "Detalhes" deixa claro que a linha abre a folha do episódio (reações,
// conversa, sinopse); o check marca direto.
export function EpisodeRow({
  code,
  number,
  title,
  meta,
  stillUrl,
  isStillHidden,
  onRevealStill,
  mark,
  me,
  partner,
  isNext,
  social,
  checked,
  canMark,
  isPending,
  onToggle,
  onOpen,
}: EpisodeRowProps) {
  const label = `E${String(number).padStart(2, '0')}`;
  const eyebrow = [label, isNext ? 'Próximo' : null, meta].filter(
    (part): part is string => part !== null,
  );

  return (
    <li className="border-b border-line last:border-b-0">
      <div className="flex items-start gap-3 py-3">
        <EpisodeThumb
          code={code}
          label={label}
          stillUrl={stillUrl}
          isHidden={isStillHidden}
          isNext={isNext}
          mark={mark}
          me={me}
          partner={partner}
          social={social}
          onReveal={onRevealStill}
          onOpen={onOpen}
        />

        <button
          type="button"
          aria-haspopup="dialog"
          onClick={(event) => onOpen(event.currentTarget)}
          className="group flex min-w-0 flex-1 flex-col items-start gap-1 rounded-md text-left"
        >
          <span className="sr-only">
            {code}. {markLabel(mark, partner)}.{isNext && ' Próximo para você.'}
          </span>
          <span
            aria-hidden
            className="flex flex-wrap items-center gap-x-1.5 text-xs text-fg-subtle tabular-nums"
          >
            {eyebrow.map((part, index) => (
              <Fragment key={part}>
                {index > 0 && <span>·</span>}
                <span
                  className={cx(
                    index === 0 && 'font-mono font-semibold text-fg-muted',
                    part === 'Próximo' && 'font-bold text-accent',
                  )}
                >
                  {part}
                </span>
              </Fragment>
            ))}
          </span>
          {meta && <span className="sr-only">{meta}.</span>}
          <ReactionsForReader social={social} partner={partner} />
          <span className="line-clamp-2 text-sm leading-snug font-semibold">{title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="inline-flex h-7 items-center gap-0.5 rounded-full bg-surface-2 pr-1.5 pl-2.5 text-xs font-semibold text-fg-muted transition-colors group-hover:bg-line group-hover:text-fg">
              Detalhes
              <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
            </span>
            {social.comments > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-fg-subtle tabular-nums">
                <MessageCircle size={13} strokeWidth={2.5} aria-hidden />
                {social.comments}
                <span className="sr-only">
                  {social.comments === 1 ? 'comentário' : 'comentários'}
                </span>
              </span>
            )}
          </span>
        </button>

        <WatchToggle
          code={code}
          checked={checked}
          disabled={!canMark || isPending}
          isPending={isPending}
          onToggle={onToggle}
        />
      </div>

      {!canMark && (
        <p className="pb-3 pl-35 text-xs text-fg-subtle sm:pl-43">
          Saiu depois que a série entrou na lista e ainda não pode ser marcado.
        </p>
      )}
    </li>
  );
}

interface EpisodeThumbProps {
  code: string;
  label: string;
  stillUrl: string | null;
  isHidden: boolean;
  isNext: boolean;
  mark: EpisodeMarkKind;
  me: Person;
  partner: Person | null;
  social: EpisodeSocial;
  onReveal: () => void;
  onOpen: (trigger: HTMLElement) => void;
}

// A imagem do episódio. Escondida: borrada, com o olho riscado, e o primeiro toque só
// mostra (como o spoiler do Discord). Depois, tocar nela abre o episódio, como o título.
function EpisodeThumb({
  code,
  label,
  stillUrl,
  isHidden,
  isNext,
  mark,
  me,
  partner,
  social,
  onReveal,
  onOpen,
}: EpisodeThumbProps) {
  const hidden = isHidden && stillUrl !== null;

  return (
    <button
      type="button"
      onClick={(event) => (hidden ? onReveal() : onOpen(event.currentTarget))}
      aria-label={hidden ? `Mostrar a imagem de ${code}` : `Abrir ${code}`}
      aria-haspopup={hidden ? undefined : 'dialog'}
      className={cx(
        'relative block aspect-video w-32 shrink-0 rounded-md bg-surface-2 sm:w-40',
        isNext && 'ring-2 ring-accent ring-offset-2 ring-offset-canvas',
      )}
    >
      {/* O corte fica num filho: o contorno de foco do botão não é cortado junto. */}
      <span className="absolute inset-0 overflow-hidden rounded-md">
        {stillUrl ? (
          <img
            src={stillUrl}
            alt=""
            loading="lazy"
            className={cx(
              'h-full w-full object-cover transition-[filter,scale] duration-300',
              hidden && 'scale-110 blur-md brightness-75',
            )}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-base font-semibold text-fg-subtle">
            {label}
          </span>
        )}
        {hidden && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/55 text-fg backdrop-blur-sm">
              <EyeOff size={15} strokeWidth={2.25} aria-hidden />
            </span>
          </span>
        )}
        <ReactionSticker social={social} />
        <WatchBar kind={mark} me={me} partner={partner} />
      </span>
    </button>
  );
}

// As reações de vocês coladas no canto da imagem, como figurinhas numa foto. A do par,
// enquanto é spoiler para você, vira 🙈. Só visual: o leitor de tela ouve pela linha.
function ReactionSticker({ social }: { social: EpisodeSocial }) {
  const emojis = [
    social.myReaction,
    social.partnerReaction && (social.partnerReaction.emoji ?? '🙈'),
  ];
  const shown = emojis.filter((emoji): emoji is string => !!emoji);
  if (shown.length === 0) return null;

  return (
    <span
      aria-hidden
      className="absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-canvas/70 px-1.5 py-1 text-xs leading-none backdrop-blur-sm"
    >
      {shown.map((emoji, index) => (
        <span key={index}>{emoji}</span>
      ))}
    </span>
  );
}

function ReactionsForReader({
  social,
  partner,
}: {
  social: EpisodeSocial;
  partner: Person | null;
}) {
  const { myReaction, partnerReaction } = social;
  if (!myReaction && !partnerReaction) return null;
  const partnerName = partner?.shortName ?? 'Seu par';

  return (
    <span className="sr-only">
      {myReaction && `Sua reação: ${myReaction}. `}
      {partnerReaction &&
        (partnerReaction.emoji
          ? `Reação de ${partnerName}: ${partnerReaction.emoji}.`
          : `${partnerName} reagiu. Assista para ver.`)}
    </span>
  );
}

interface WatchToggleProps {
  code: string;
  checked: boolean;
  disabled: boolean;
  isPending: boolean;
  onToggle: () => void;
}

// O "eu vi": neutro de propósito. A cor de quem viu fica na barra da imagem; o laranja é
// só do "juntos".
function WatchToggle({ code, checked, disabled, isPending, onToggle }: WatchToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={checked}
      aria-label={checked ? `Desmarcar ${code} pra você` : `Marcar que você viu ${code}`}
      className="group flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={cx(
          'flex h-7 w-7 items-center justify-center rounded-full transition-[background-color,box-shadow,scale] duration-150 group-active:scale-90',
          checked
            ? 'bg-surface-2 text-fg ring-1 ring-line ring-inset'
            : 'text-fg-subtle ring-2 ring-line ring-inset group-hover:ring-fg-subtle',
        )}
      >
        {isPending ? (
          <LoaderCircle size={15} aria-hidden className="animate-spin" />
        ) : (
          checked && <Check size={16} strokeWidth={3} aria-hidden />
        )}
      </span>
    </button>
  );
}
