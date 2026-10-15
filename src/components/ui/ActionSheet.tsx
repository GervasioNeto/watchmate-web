import { useState, type MouseEvent, type ReactNode } from 'react';
import { Sheet } from '@/components/ui/Sheet';
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

// Menu de ações numa folha modal (ver Sheet): o título, as opções e nada mais. Escolher
// uma opção fecha o menu antes de agir.
export function ActionSheet({ title, description, items, renderTrigger }: ActionSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Quem abriu o menu recebe o foco de volta ao fechar.
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);

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
      <Sheet
        open={isOpen}
        onClose={close}
        title={title}
        description={description}
        returnFocusTo={trigger}
      >
        <div className="-mx-2 flex flex-col gap-1">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => select(item)}
              className={cx(
                'min-h-11 rounded-md px-2 text-left text-sm font-semibold transition-colors hover:bg-surface-2',
                item.destructive ? 'text-danger' : 'text-fg',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
