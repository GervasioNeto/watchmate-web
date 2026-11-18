import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { giftQueries } from '@/api/queries';
import { GiftBox } from '@/components/gifts/GiftBox';
import { FloatingHearts } from '@/components/gifts/reveal/FloatingHearts';
import { spentBoxDelayMs } from '@/components/gifts/reveal/choreography';
import { GiftContents } from '@/components/gifts/reveal/GiftContents';
import { WrappedGift } from '@/components/gifts/reveal/WrappedGift';
import { IconButton } from '@/components/ui/IconButton';
import { useCountdown } from '@/hooks/useCountdown';
import { useOpenGift } from '@/hooks/useGifts';
import { cx } from '@/lib/cx';
import { wrapOf } from '@/lib/gifts';
import { createHeartBurst, type HeartBurst } from '@/lib/heartBurst';
import type { Person } from '@/lib/people';
import type { Gift } from '@/types/api';

// Quanto a caixa chacoalha antes de os corações explodirem, e quando o que tem dentro sai (a
// tampa termina de voar em 1120ms: ver gift-lid-off no index.css).
const BURST_AT_MS = 560;
const REVEAL_AT_MS = 1100;
const RAIN_MS = 3400;

interface GiftRevealProps {
  gift: Gift;
  from: Person | null;
  open: boolean;
  // "Guardar" ou "Abrir depois" (fechado sem abrir, ele volta na próxima vez).
  onClose: () => void;
  // A prévia de quem está montando o presente ("assim Leila vai ver"): tudo funciona igual,
  // mas nada vai para a API (abrir, reagir e usar vale ficam só na tela).
  previewFor?: string;
}

type Stage = 'closed' | 'opening' | 'revealed';

// A surpresa, em tela inteira (um <dialog> de verdade, por cima de tudo, com o foco preso
// nele). Três momentos:
// 1. Embrulhado (WrappedGift): a caixa balança esperando o toque. Trancado, tem cadeado e
//    contagem regressiva; quando a hora chega com a tela aberta, o cadeado cai ali mesmo.
// 2. Abrindo: a caixa chacoalha, a tampa voa com o laço e os corações explodem nas cores do
//    embrulho.
// 3. Aberto (GiftContents): a caixa vazia fica onde estava, a carta e os vales saem voando
//    de dentro dela, e ela vai embora.
// Rever um presente já aberto passa pelo mesmo caminho.
export function GiftReveal({ gift, from, open, onClose, previewFor }: GiftRevealProps) {
  const titleId = useId();
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLButtonElement>(null);
  const burstRef = useRef<HeartBurst | null>(null);
  const timersRef = useRef<number[]>([]);
  const openGift = useOpenGift();
  const [stage, setStage] = useState<Stage>('closed');
  // Onde a caixa estava quando abriu: é de lá que o conteúdo sai.
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const remaining = useCountdown(previewFor ? null : gift.deliverAt);
  const locked = remaining !== null && remaining > 0;

  // Cada vez que abre (ou chega outro presente), começa embrulhado.
  const [shownFor, setShownFor] = useState<string | null>(null);
  const [wasLocked, setWasLocked] = useState(locked);
  const key = open ? gift.id : null;
  if (key !== shownFor) {
    setShownFor(key);
    setStage('closed');
    setOrigin(null);
    setUnlocking(false);
    setWasLocked(locked);
  } else if (wasLocked !== locked) {
    // Destrancou com a tela aberta: o cadeado cai.
    setWasLocked(locked);
    if (!locked) setUnlocking(true);
  }

  // ...e a carta e os vales, que até agora não vinham (era surpresa), vêm da API.
  useEffect(() => {
    if (unlocking) void queryClient.invalidateQueries({ queryKey: giftQueries.list().queryKey });
  }, [unlocking, queryClient]);

  const wrap = wrapOf(gift.wrap);
  // Trancado, a API não manda o que tem dentro: só mostra aberto quando a carta chegou.
  const ready = gift.message !== null;
  const revealed = open && stage === 'revealed' && ready;

  // O estado manda; o <dialog> só acompanha (como na Sheet).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // O foco vai para a frase do presente (é o que o leitor de tela lê), e não para o "X": a
      // surpresa abre sozinha, e o anel de foco num botão logo de cara estragaria a tela.
      dialog.querySelector<HTMLElement>('[data-reveal-focus]')?.focus({ preventScroll: true });
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Os corações são da paleta deste embrulho: trocou de presente, a explosão é outra.
  useEffect(() => {
    return () => {
      burstRef.current?.stop();
      burstRef.current = null;
      for (const timer of timersRef.current) clearTimeout(timer);
      timersRef.current = [];
    };
  }, [gift.id, open]);

  function unwrap() {
    if (stage !== 'closed' || locked) return;
    const box = boxRef.current?.getBoundingClientRect() ?? null;
    setOrigin(box);
    setStage('opening');
    if (!previewFor && !gift.openedAt) {
      openGift.mutate(gift.id, {
        // Não abriu (sem rede, ou o relógio do celular adiantado): volta a ficar embrulhado.
        onError: () => {
          for (const timer of timersRef.current) clearTimeout(timer);
          timersRef.current = [];
          setStage('closed');
        },
      });
    }

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timersRef.current.push(
      window.setTimeout(
        () => {
          const canvas = canvasRef.current;
          if (!canvas || !box) return;
          burstRef.current ??= createHeartBurst(canvas, wrap.hearts);
          burstRef.current.burst({
            x: (box.left + box.width / 2) / window.innerWidth,
            y: (box.top + box.height * 0.4) / window.innerHeight,
          });
          burstRef.current.rain(RAIN_MS);
        },
        calm ? 0 : BURST_AT_MS,
      ),
      window.setTimeout(() => setStage('revealed'), calm ? 0 : REVEAL_AT_MS),
    );
  }

  const error =
    openGift.isError && stage === 'closed'
      ? openGift.error.message || 'Não deu para abrir agora. Tente de novo.'
      : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="gift-reveal"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      style={{ '--gift-glow': wrap.glow, '--gift-ribbon': wrap.ribbon } as CSSProperties}
    >
      <div className="relative flex h-full flex-col">
        <div
          aria-hidden
          className={cx(
            'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--gift-glow),transparent_62%)] transition-opacity duration-700',
            locked && 'opacity-50',
          )}
        />
        <FloatingHearts color={wrap.ribbon} />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-30 h-full w-full"
        />

        <div className="relative z-20 flex items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {previewFor ? (
            <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-fg/10 px-3 py-1.5 text-xs font-bold">
              👀 Prévia · assim {previewFor} vai ver
            </span>
          ) : (
            <span />
          )}
          <IconButton
            aria-label={revealed || locked ? 'Fechar' : 'Abrir depois'}
            onClick={onClose}
            className="rounded-full hover:bg-fg/10"
          >
            <X size={22} aria-hidden />
          </IconButton>
        </div>

        {open &&
          (revealed ? (
            <GiftContents
              titleId={titleId}
              gift={gift}
              from={from}
              wrap={wrap}
              origin={origin}
              onClose={onClose}
              previewFor={previewFor}
            />
          ) : (
            <WrappedGift
              gift={gift}
              from={from}
              wrap={wrap}
              titleId={titleId}
              opening={stage !== 'closed'}
              remaining={remaining}
              unlocking={unlocking}
              onUnlocked={() => setUnlocking(false)}
              onUnwrap={unwrap}
              error={error}
              boxRef={boxRef}
            />
          ))}

        {/* A caixa vazia, no mesmo lugar e tamanho: o conteúdo sai dela, e ela afunda. */}
        {revealed && origin && (
          <div
            aria-hidden
            className="gift-spent pointer-events-none absolute z-[5]"
            style={
              {
                left: origin.left,
                top: origin.top,
                width: origin.width,
                height: origin.height,
                '--spent-delay': `${spentBoxDelayMs(gift.vouchers.length)}ms`,
              } as CSSProperties
            }
          >
            <GiftBox wrap={wrap} state="empty" size={origin.width} className="block" />
          </div>
        )}
      </div>
    </dialog>
  );
}
