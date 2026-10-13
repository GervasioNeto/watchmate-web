import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/Wordmark';
import { Avatar } from '@/components/ui/Avatar';
import { useCouple } from '@/hooks/useCouple';

export function AppHeader() {
  const { me } = useCouple();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
        <Link to="/my-list" aria-label="Ir para a sua lista" className="rounded-md">
          <Wordmark />
        </Link>
        <Link
          to="/profile"
          aria-label="Seu perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full"
        >
          <Avatar person={me} size="md" />
        </Link>
      </div>
    </header>
  );
}
