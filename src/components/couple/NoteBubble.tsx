import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

// De que lado do balão fica o avatar de quem fala: o rabinho aponta para ele.
export type TailSide = 'start' | 'end';

// Base de todo balão (sem padding: cada um define o seu). O rabinho (BubbleTail) é
// posicionado em relação a ele. O texto aparece inteiro: o limite de 80 caracteres já
// segura a altura (umas 5 linhas no celular, no pior caso).
export const BUBBLE_CLASSES =
  'relative min-w-0 rounded-lg text-left text-sm leading-snug break-words';

// Cor de um recado escrito (o seu e o do par): papel branco, letra preta. Quem é quem
// fica com o rabinho, que aponta para o avatar de cada um.
export const NOTE_COLOR_CLASSES = 'bg-note text-on-note';

// O rabinho é um triângulo recortado da mesma cor do balão, com a ponta para baixo,
// do lado do avatar. Fica 24px para dentro da borda: com os balões 16px afastados, é
// o centro de cada avatar do par no palco (ver CoupleAvatars).
export function BubbleTail({ side, colorClass }: { side: TailSide; colorClass: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'absolute top-full -mt-px h-3 w-3.5',
        side === 'end'
          ? 'right-6 [clip-path:polygon(0_0,100%_0,100%_100%)]'
          : 'left-6 [clip-path:polygon(0_0,100%_0,0_100%)]',
        colorClass,
      )}
    />
  );
}

// O recado e, no canto, há quanto tempo foi escrito. A idade é o que mostra que um
// "bora hoje?" ficou velho; por isso o recado não expira sozinho.
export function NoteContent({ text, time }: { text: string; time: string }) {
  return (
    <>
      <span className="block">{text}</span>
      <span className="mt-0.5 block text-right text-xs opacity-70">{time}</span>
    </>
  );
}

interface NoteBubbleProps {
  // Fundo e texto do balão (a cor da pessoa).
  colorClass: string;
  tail: TailSide;
  children: ReactNode;
  // Bolinha de "recado novo" no canto de fora.
  isNew?: boolean;
}

// Balão só de leitura: o recado do seu par.
export function NoteBubble({ colorClass, tail, children, isNew }: NoteBubbleProps) {
  return (
    <div className={cx(BUBBLE_CLASSES, 'px-3 py-2', colorClass)}>
      <p>{children}</p>
      <BubbleTail side={tail} colorClass={colorClass} />
      {isNew && (
        <span
          aria-hidden
          className={cx(
            'absolute -top-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface',
            tail === 'start' ? '-right-1' : '-left-1',
          )}
        />
      )}
    </div>
  );
}
