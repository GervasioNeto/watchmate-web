import { useRef, type KeyboardEvent } from 'react';

interface RadioGroupOptions<T> {
  // Opções em grade: ↑ e ↓ andam uma linha inteira (← e → seguem uma por uma).
  columns?: number;
  // Opções que não podem ser escolhidas: as setas passam por cima delas.
  isDisabled?: (value: T) => boolean;
}

// Comportamento de grupo de rádio (padrão WAI-ARIA): só a opção marcada entra no Tab,
// e as setas/Home/End movem a seleção e o foco juntos.
export function useRadioGroup<T extends string>(
  values: readonly T[],
  value: T,
  onChange: (value: T) => void,
  { columns = 1, isDisabled = () => false }: RadioGroupOptions<T> = {},
) {
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = values.indexOf(value);

  // Anda `step` posições (dando a volta) até achar uma opção que pode ser escolhida.
  function move(from: number, step: number): number {
    let index = from;
    for (let tries = 0; tries < values.length; tries++) {
      index = (index + step + values.length) % values.length;
      if (!isDisabled(values[index])) return index;
    }
    return from;
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const from = Math.max(0, selectedIndex);
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = move(from, 1);
        break;
      case 'ArrowLeft':
        next = move(from, -1);
        break;
      case 'ArrowDown':
        next = move(from, columns);
        break;
      case 'ArrowUp':
        next = move(from, -columns);
        break;
      case 'Home':
        next = move(-1, 1);
        break;
      case 'End':
        next = move(values.length, -1);
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
