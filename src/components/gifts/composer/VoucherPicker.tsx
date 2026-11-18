import { useState } from 'react';
import { Check, PenLine, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useRadioGroup } from '@/hooks/useRadioGroup';
import { cx } from '@/lib/cx';
import {
  addVoucher,
  cleanVoucherText,
  hasVoucher,
  isFull,
  removeVoucher,
  toggleVoucher,
  type DraftVoucher,
  type GiftDraft,
} from '@/lib/giftDraft';
import {
  MAX_VOUCHERS,
  VOUCHER_EMOJIS,
  VOUCHER_PRESETS,
  VOUCHER_TEXT_MAX_LENGTH,
} from '@/lib/gifts';

interface VoucherPickerProps {
  draft: GiftDraft;
  onChange: (draft: GiftDraft) => void;
}

// Os vales em grade de cupons: os prontos (tocar põe e tira) e os escritos à mão (tocar tira).
// O último lugar da grade é para escrever o seu. Cheio, o que não está no presente apaga.
export function VoucherPicker({ draft, onChange }: VoucherPickerProps) {
  const [writing, setWriting] = useState(false);
  const full = isFull(draft);
  const custom = draft.vouchers.filter(
    (voucher) => !VOUCHER_PRESETS.some((preset) => preset.text === voucher.text),
  );
  // "Escrever o meu" ocupa a linha toda quando ficaria sozinho nela.
  const writeSpansRow = (VOUCHER_PRESETS.length + custom.length) % 2 === 0;

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Vales" className="grid grid-cols-2 gap-2">
        {VOUCHER_PRESETS.map((preset) => {
          const selected = hasVoucher(draft, preset.text);
          return (
            <VoucherTile
              key={preset.text}
              voucher={preset}
              selected={selected}
              disabled={!selected && full}
              onClick={() => onChange(toggleVoucher(draft, preset))}
            />
          );
        })}
        {custom.map((voucher) => (
          <VoucherTile
            key={voucher.text}
            voucher={voucher}
            selected
            removable
            onClick={() => onChange(removeVoucher(draft, voucher.text))}
          />
        ))}
        {!full && !writing && (
          <button
            type="button"
            onClick={() => setWriting(true)}
            className={cx(
              'flex min-h-16 items-center justify-center gap-2 rounded-md border-2 border-dashed border-line text-[13px] font-semibold text-fg-muted transition-colors hover:border-fg-subtle hover:text-fg',
              writeSpansRow && 'col-span-2',
            )}
          >
            <PenLine size={16} strokeWidth={2.25} aria-hidden />
            Escrever o meu
          </button>
        )}
      </div>

      {writing && !full && (
        <VoucherWriter
          onAdd={(voucher) => {
            const next = addVoucher(draft, voucher);
            if (next === draft) return false;
            onChange(next);
            setWriting(false);
            return true;
          }}
          onCancel={() => setWriting(false)}
        />
      )}

      {/* O limite só aparece quando chega nele. */}
      {full && (
        <p className="text-xs text-fg-subtle">
          Cabem {MAX_VOUCHERS} vales por presente. Tire um para trocar.
        </p>
      )}
    </div>
  );
}

interface VoucherTileProps {
  voucher: DraftVoucher;
  selected: boolean;
  disabled?: boolean;
  // Escrito à mão: tocar tira (não tem como "desmarcar" e marcar de novo).
  removable?: boolean;
  onClick: () => void;
}

// Um cupom pequeno, como o vale que chega: o canhoto com o emoji e o pedido. No presente, o
// canhoto e o contorno ganham a cor do embrulho.
function VoucherTile({ voucher, selected, disabled, removable, onClick }: VoucherTileProps) {
  return (
    <button
      type="button"
      aria-pressed={removable ? undefined : selected}
      aria-label={removable ? `Tirar o vale ${voucher.text}` : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'relative flex min-h-16 items-stretch overflow-hidden rounded-md text-left transition-[background-color,box-shadow,opacity] duration-200 disabled:opacity-40',
        selected
          ? 'bg-[color-mix(in_oklab,var(--gift-paper)_14%,var(--color-surface-2))] shadow-[inset_0_0_0_2px_var(--gift-paper)]'
          : 'bg-surface-2 hover:bg-line',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'flex w-11 shrink-0 items-center justify-center border-r-2 border-dashed text-xl transition-colors duration-200',
          selected ? 'border-canvas/35 bg-(--gift-paper)' : 'border-canvas/60 bg-fg/5',
        )}
      >
        {voucher.emoji}
      </span>
      <span className="flex min-w-0 flex-1 items-center py-2 pr-7 pl-2.5 text-[13px] leading-snug font-semibold wrap-break-word">
        {voucher.text}
      </span>
      {selected && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-(--gift-paper) text-canvas"
        >
          {removable ? <X size={12} strokeWidth={3.25} /> : <Check size={12} strokeWidth={3.5} />}
        </span>
      )}
    </button>
  );
}

interface VoucherWriterProps {
  // false: não coube (vazio, repetido ou cheio) e o texto fica para arrumar.
  onAdd: (voucher: DraftVoucher) => boolean;
  onCancel: () => void;
}

// Escrever um vale: o emoji do canhoto e o pedido. Enter põe; Esc desiste (sem fechar a folha).
function VoucherWriter({ onAdd, onCancel }: VoucherWriterProps) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState<string>(VOUCHER_EMOJIS[0]);
  const { groupProps, itemProps } = useRadioGroup(VOUCHER_EMOJIS, emoji, setEmoji);
  const clean = cleanVoucherText(text);

  return (
    <div className="flex animate-rise-in flex-col gap-3 rounded-lg border border-line p-3">
      <div {...groupProps} aria-label="Emoji do vale" className="flex flex-wrap gap-1">
        {VOUCHER_EMOJIS.map((option, index) => (
          <button
            key={option}
            {...itemProps(index)}
            type="button"
            aria-label={option}
            onClick={() => setEmoji(option)}
            className={cx(
              'flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors',
              emoji === option
                ? 'bg-[color-mix(in_oklab,var(--gift-paper)_22%,transparent)] shadow-[inset_0_0_0_2px_var(--gift-paper)]'
                : 'hover:bg-surface-2',
            )}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <TextInput
          // A pessoa tocou em "Escrever o meu": o teclado já sobe.
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (clean) onAdd({ text: clean, emoji });
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              onCancel();
            }
          }}
          maxLength={VOUCHER_TEXT_MAX_LENGTH}
          placeholder="Um café na cama"
          aria-label="O seu vale"
          className="flex-1"
        />
        <Button onClick={() => onAdd({ text: clean, emoji })} disabled={!clean}>
          Pôr
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-fg-subtle">
          {clean ? `${emoji} Vale ${clean.charAt(0).toLowerCase()}${clean.slice(1)}` : 'Vale…'}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-xs font-semibold text-fg-muted hover:text-fg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
