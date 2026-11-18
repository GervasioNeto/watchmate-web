import { useState, type Ref } from 'react';
import { LockKeyhole } from 'lucide-react';
import { GiftBox } from '@/components/gifts/GiftBox';
import { Countdown } from '@/components/gifts/reveal/Countdown';
import { Avatar } from '@/components/ui/Avatar';
import { cx } from '@/lib/cx';
import { formatOpening, occasionOf, type WrapTheme } from '@/lib/gifts';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';
import type { Gift } from '@/types/api';

const BOX_SIZE = 224;

interface WrappedGiftProps {
  gift: Gift;
  from: Person | null;
  wrap: WrapTheme;
  titleId: string;
  // A tampa já está voando.
  opening: boolean;
  // Quanto falta para destrancar (ms). Mais que 0: trancado. Null: não tem hora (a prévia).
  remaining: number | null;
  // Acabou de destrancar com a tela aberta: o cadeado está caindo.
  unlocking: boolean;
  onUnlocked: () => void;
  onUnwrap: () => void;
  error: string | null;
  boxRef: Ref<HTMLButtonElement>;
}

// O presente ainda embrulhado: quem mandou, a ocasião e a caixa no meio da tela. Pronto para
// abrir, ela balança esperando o toque. Trancado, tem cadeado na fita e o placar do que falta;
// tocar só faz a caixa chacoalhar ("ainda não!").
export function WrappedGift({
  gift,
  from,
  wrap,
  titleId,
  opening,
  remaining,
  unlocking,
  onUnlocked,
  onUnwrap,
  error,
  boxRef,
}: WrappedGiftProps) {
  // Cada toque no trancado chacoalha de novo (a chave refaz a animação).
  const [denials, setDenials] = useState(0);
  const locked = remaining !== null && remaining > 0;
  const occasion = occasionOf(gift.occasion);
  const opensAt = new Date(gift.deliverAt);
  const name = from?.shortName ?? 'Seu par';
  // Mantém o placar no zero enquanto o cadeado cai, para nada pular na tela.
  const showsCountdown = locked || unlocking;
  const when = formatOpening(opensAt, new Date(opensAt.getTime() - (remaining ?? 0)));

  function tap() {
    if (opening) return;
    if (locked) {
      setDenials((count) => count + 1);
      navigator.vibrate?.(40);
      return;
    }
    if (!unlocking) onUnwrap();
  }

  const hint =
    error ??
    (opening
      ? 'Abrindo…'
      : locked
        ? denials > 0
          ? 'Ainda não! Só abre na hora certinha 😌'
          : ''
        : unlocking
          ? 'Chegou a hora! 💝'
          : 'Toque para abrir');

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 px-6 pb-[max(3rem,env(safe-area-inset-bottom))] text-center">
      <div
        className={cx(
          'flex flex-col items-center gap-3 transition-opacity duration-300',
          opening && 'opacity-0',
        )}
      >
        <Avatar
          person={from}
          size="lg"
          className={cx(
            'ring-2 ring-offset-4 ring-offset-canvas',
            from && TONE_CLASSES[from.tone].ring,
          )}
        />
        <p
          id={titleId}
          tabIndex={-1}
          data-reveal-focus
          className="text-base text-fg-muted focus:outline-none"
        >
          <strong className="font-bold text-fg">{name}</strong> deixou um presente pra você
        </p>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-fg/10 px-3 py-1 text-xs font-semibold">
          <span aria-hidden>{occasion.emoji}</span>
          {occasion.label}
        </p>
      </div>

      <button
        ref={boxRef}
        type="button"
        onClick={tap}
        aria-disabled={opening || locked}
        aria-label={locked ? `Presente trancado. Abre ${when}` : 'Abrir o presente'}
        className="rounded-full focus-visible:outline-offset-8"
      >
        <span key={denials} className={cx('block', denials > 0 && 'gift-denied')}>
          <GiftBox
            wrap={wrap}
            state={opening ? 'opening' : showsCountdown ? 'still' : 'closed'}
            lock={locked ? 'locked' : unlocking ? 'unlocking' : undefined}
            onUnlocked={onUnlocked}
            size={BOX_SIZE}
            className="block"
          />
        </span>
      </button>

      {showsCountdown && (
        <div
          className={cx(
            'flex flex-col items-center gap-3 transition-opacity duration-300',
            unlocking && 'opacity-40',
          )}
        >
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <LockKeyhole size={15} strokeWidth={2.5} aria-hidden />
            Abre {when}
          </p>
          <Countdown ms={remaining ?? 0} />
        </div>
      )}

      <p
        aria-live="polite"
        className={cx(
          'min-h-6',
          error
            ? 'text-sm font-semibold text-danger'
            : locked
              ? 'text-sm font-semibold text-fg-muted'
              : 'text-base font-bold',
          !error && !opening && !showsCountdown && 'animate-breathe',
        )}
      >
        {hint}
      </p>
    </div>
  );
}
