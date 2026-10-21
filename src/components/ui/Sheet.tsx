import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cx } from '@/lib/cx';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  // Quem abriu a folha recebe o foco de volta ao fechar. O Safari não foca botões no
  // clique, então o navegador sozinho não saberia para onde voltar.
  returnFocusTo?: HTMLElement | null;
  children: ReactNode;
  // Fica fixo embaixo, fora da rolagem (ex.: o botão "Pronto").
  footer?: ReactNode;
}

// Folha modal num <dialog>: enquanto está aberta, a página atrás fica inerte (nenhum
// clique passa) e o foco fica preso dentro. No celular sobe do rodapé, perto do dedo; em
// telas maiores fica no meio (ver dialog.sheet no index.css). `open` é a única fonte da
// verdade: Esc, o "voltar" do Android e o toque no fundo passam todos por `onClose`.
export function Sheet({
  open,
  onClose,
  title,
  description,
  returnFocusTo,
  children,
  footer,
}: SheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // Só fecha se o toque começou E terminou no fundo: arrastar de dentro da folha para fora
  // (ao rolar uma lista, por exemplo) não conta como clique fora.
  const pressedOnBackdrop = useRef(false);

  // O estado manda; o <dialog> só acompanha.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // O <dialog> guarda a rolagem da última vez em que esteve aberto: cada abertura começa
      // do topo. Só depois do showModal, quando a rolagem existe de novo.
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }
    if (!open && dialog.open) {
      dialog.close();
      returnFocusTo?.focus();
    }
  }, [open, returnFocusTo]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="sheet"
      // Esc (ou o "voltar" do Android) dispara `cancel` antes de fechar. Em vez de deixar o
      // navegador fechar por fora do React, fechamos pelo estado.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Rede de segurança: se o dialog fechar por outro caminho, o estado acompanha. O
      // evento chega um instante depois de fechar; se a folha já foi reaberta, ignora.
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        // O fundo escuro faz parte do <dialog>: um clique nele tem o próprio dialog como alvo.
        if (pressedOnBackdrop.current && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[calc(100dvh-1rem)] flex-col rounded-t-lg border-t border-line bg-surface sm:max-h-[calc(100dvh-4rem)] sm:rounded-lg sm:border">
        <div className="flex items-start gap-2 py-3 pr-2 pl-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-2">
            <h2 id={titleId} className="text-base leading-tight font-bold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-sm text-fg-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton aria-label="Fechar" onClick={onClose}>
            <X size={20} aria-hidden />
          </IconButton>
        </div>

        <div
          ref={bodyRef}
          className={cx(
            'min-h-0 flex-1 overflow-y-auto px-4',
            footer ? 'pb-4' : 'pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
        >
          {/* O conteúdo só existe com a folha aberta: nada é montado (nem buscado) à toa, e
              cada abertura começa do zero. */}
          {open && children}
        </div>

        {footer && (
          <div className="border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
