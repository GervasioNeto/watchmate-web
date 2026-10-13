import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-16 w-16 text-2xl',
};

const roleClasses = {
  me: 'bg-me-soft text-on-me-soft',
  partner: 'bg-partner-soft text-on-partner-soft',
};

interface AvatarProps {
  // null desenha o lugar vazio de quem ainda não entrou no grupo.
  person: Person | null;
  size?: Size;
  className?: string;
}

// Você é sempre roxo e o seu par sempre rosa, em qualquer tela.
export function Avatar({ person, size = 'md', className }: AvatarProps) {
  if (!person) {
    return (
      <span
        aria-hidden
        className={cx(
          'inline-block shrink-0 rounded-full border border-dashed border-line',
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      title={person.name}
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        roleClasses[person.role],
        sizeClasses[size],
        className,
      )}
    >
      {person.initial}
    </span>
  );
}
