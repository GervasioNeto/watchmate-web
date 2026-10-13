import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { cx } from '@/lib/cx';

export interface ActionSheetItem {
  key: string;
  label: string;
  destructive?: boolean;
  onSelect: () => void;
}

interface TriggerProps {
  onClick: (event: MouseEvent<HTMLElement>) => void;
  'aria-haspopup': 'dialog';
  'aria-expanded': boolean;
}

interface ActionSheetProps {
  title: string;
  description?: string;
  items: ActionSheetItem[];
  // Recebe as props que ligam o botão ao menu.
  renderTrigger: (triggerProps: TriggerProps) => ReactNode;
}

// Folha de ações no rodapé da tela, num <dialog> modal: enquanto está aberta, o resto
// da página fica inerte (nenhum clique passa para o que está atrás) e o foco fica preso
// dentro dela. O estado `isOpen` é a única fonte da verdade: até o Esc passa por ele.
export function ActionSheet({ title, description, items, renderTrigger }: ActionSheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Quem abriu o menu recebe o foco de volta ao fechar (o Safari não foca botões no clique).
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  // Só fecha se o toque começou E terminou no fundo; arrastar de dentro da folha
  // para fora não conta como clique fora.
  const pressedOnBackdrop = useRef(false);

  // O estado manda; o <dialog> só acompanha.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) {
      dialog.close();
      trigger?.focus();
    }
  }, [isOpen, trigger]);

  function open(event: MouseEvent<HTMLElement>) {
    setTrigger(event.currentTarget);
    setIsOpen(true);
  }

  const close = () => setIsOpen(false);

  function select(item: ActionSheetItem) {
    close();
    item.onSelect();
  }

  return (
    <>
      {renderTrigger({ onClick: open, 'aria-haspopup': 'dialog', 'aria-expanded': isOpen })}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="action-sheet"
        // Esc (ou o "voltar" do Android) dispara `cancel` antes de fechar. Em vez de deixar
        // o navegador fechar por fora do React, fechamos pelo estado.
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        // Rede de segurança: se o dialog fechar por outro caminho, o estado acompanha. O
        // evento chega um instante depois de fechar; se o menu já foi reaberto, ignora.
        onClose={(event) => {
          if (!event.currentTarget.open) close();
        }}
        onPointerDown={(event) => {
          pressedOnBackdrop.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          // O fundo escuro faz parte do <dialog>: um clique nele tem o próprio dialog como alvo.
          if (pressedOnBackdrop.current && event.target === event.currentTarget) close();
        }}
      >
        <div className="m-3 flex flex-col gap-1 rounded-lg border border-line bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="px-3 pt-2 pb-1">
            <p id={titleId} className="text-sm font-semibold text-fg">
              {title}
            </p>
            {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
          </div>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => select(item)}
              className={cx(
                'min-h-11 rounded-md px-3 text-left text-sm font-semibold transition-colors hover:bg-surface-2',
                item.destructive ? 'text-danger' : 'text-fg',
              )}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={close}
            className="mt-1 min-h-11 rounded-md border-t border-line px-3 text-left text-sm text-fg-muted transition-colors hover:bg-surface-2"
          >
            Cancelar
          </button>
        </div>
      </dialog>
    </>
  );
}
