import { useId, useRef, type ReactNode, type ToggleEvent } from 'react';
import { cx } from '@/lib/cx';

export interface ActionSheetItem {
  key: string;
  label: string;
  destructive?: boolean;
  onSelect: () => void;
}

interface ActionSheetProps {
  title: string;
  description?: string;
  items: ActionSheetItem[];
  // Recebe as props que ligam o botão ao menu (Popover API nativa).
  renderTrigger: (triggerProps: { popoverTarget: string }) => ReactNode;
}

// Folha de ações no rodapé da tela. A Popover API cuida de Esc, clique fora,
// camada superior e devolução do foco para quem abriu.
export function ActionSheet({ title, description, items, renderTrigger }: ActionSheetProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const sheetRef = useRef<HTMLDivElement>(null);

  function handleToggle(event: ToggleEvent<HTMLDivElement>) {
    if (event.newState === 'open') {
      sheetRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }
  }

  function select(item: ActionSheetItem) {
    sheetRef.current?.hidePopover();
    item.onSelect();
  }

  return (
    <>
      {renderTrigger({ popoverTarget: id })}
      <div
        id={id}
        ref={sheetRef}
        popover="auto"
        role="dialog"
        aria-labelledby={titleId}
        onToggle={handleToggle}
        className="action-sheet"
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
            popoverTarget={id}
            popoverTargetAction="hide"
            className="mt-1 min-h-11 rounded-md border-t border-line px-3 text-left text-sm text-fg-muted transition-colors hover:bg-surface-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}
