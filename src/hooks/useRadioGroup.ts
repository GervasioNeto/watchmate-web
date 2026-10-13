import { useRef, type KeyboardEvent } from 'react';

// Comportamento de grupo de rádio (padrão WAI-ARIA): só a opção marcada entra no Tab,
// e as setas/Home/End movem a seleção e o foco juntos.
export function useRadioGroup<T extends string>(
  values: readonly T[],
  value: T,
  onChange: (value: T) => void,
) {
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = values.indexOf(value);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const last = values.length - 1;
    const from = Math.max(0, selectedIndex);
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = from === last ? 0 : from + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = from === 0 ? last : from - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    onChange(values[next]);
    itemsRef.current[next]?.focus();
  }

  function itemProps(index: number) {
    const checked = index === selectedIndex;
    // Sem nenhuma marcada, a primeira fica alcançável pelo Tab.
    const focusable = checked || (selectedIndex === -1 && index === 0);
    return {
      ref: (element: HTMLButtonElement | null) => {
        itemsRef.current[index] = element;
      },
      role: 'radio' as const,
      'aria-checked': checked,
      tabIndex: focusable ? 0 : -1,
    };
  }

  return { groupProps: { role: 'radiogroup' as const, onKeyDown }, itemProps };
}
