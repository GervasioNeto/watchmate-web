import { useEffect, useState, type CSSProperties } from 'react';
import { Stamp } from '@/components/ui/Stamp';
import { cx } from '@/lib/cx';
import type { WrapTheme } from '@/lib/gifts';
import type { GiftVoucher } from '@/types/api';

// Os recortes do cupom, onde o canhoto encontra o papel: dois meios-círculos transparentes
// (máscara), então o fundo aparece por eles, seja ele qual for.
const STUB_WIDTH = '4.25rem';
const NOTCHES: CSSProperties = {
  mask: `radial-gradient(circle 0.5rem at ${STUB_WIDTH} 0, transparent 98%, #000) top / 100% 51% no-repeat, radial-gradient(circle 0.5rem at ${STUB_WIDTH} 100%, transparent 98%, #000) bottom / 100% 51% no-repeat`,
};

interface VoucherTicketProps {
  voucher: GiftVoucher;
  wrap: WrapTheme;
  // Quem recebeu pode usar (o vale é dela); quem deu só acompanha.
  onUse?: () => void;
  isUsing?: boolean;
  // Acabou de ser usado com a tela aberta: o carimbo "cai".
  justUsed?: boolean;
}

// Um vale do presente, como cupom: o canhoto na cor do embrulho com o emoji, o papel claro
// com VALE e o pedido. Usar pede confirmação (é um aviso que vai para o par na hora); usado,
// ganha o carimbo.
export function VoucherTicket({
  voucher,
  wrap,
  onUse,
  isUsing = false,
  justUsed = false,
}: VoucherTicketProps) {
  const [confirming, setConfirming] = useState(false);
  const used = voucher.usedAt !== null;

  // A confirmação desiste sozinha se ninguém tocar de novo.
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <div
      style={NOTCHES}
      className="relative flex min-h-[4.5rem] overflow-hidden rounded-md shadow-sm"
    >
      <span
        aria-hidden
        style={{ width: STUB_WIDTH, background: wrap.paper }}
        className="flex shrink-0 items-center justify-center text-3xl"
      >
        {voucher.emoji ?? '🎟️'}
      </span>
      <div
        className={cx(
          'relative flex min-w-0 flex-1 items-center gap-3 border-l-2 border-dashed border-on-note/25 bg-note py-2.5 pr-3 pl-3.5 text-left text-on-note',
        )}
      >
        <div className={cx('flex min-w-0 flex-1 flex-col', used && 'opacity-55')}>
          <span className="text-[10px] font-black tracking-[0.18em] uppercase opacity-60">
            Vale
          </span>
          <span className="text-sm leading-snug font-bold wrap-break-word">{voucher.text}</span>
        </div>

        {used ? (
          <Stamp label="Usado" tone="ink" size="sm" animate={justUsed} className="mr-1" />
        ) : (
          onUse && (
            <button
              type="button"
              disabled={isUsing}
              onClick={() => {
                if (confirming) {
                  setConfirming(false);
                  onUse();
                } else {
                  setConfirming(true);
                }
              }}
              className={cx(
                'min-h-9 shrink-0 rounded-full px-3.5 text-xs font-bold transition-colors disabled:opacity-60',
                confirming ? 'bg-accent text-on-accent' : 'bg-on-note text-note',
              )}
            >
              {isUsing ? 'Usando…' : confirming ? 'Usar agora?' : 'Usar'}
            </button>
          )
        )}
      </div>
    </div>
  );
}
