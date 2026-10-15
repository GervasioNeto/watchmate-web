import { Link } from 'react-router-dom';
import { HeaderNav } from '@/components/navigation/HeaderNav';
import { Wordmark } from '@/components/Wordmark';
import { Avatar } from '@/components/ui/Avatar';
import { useActiveDestination } from '@/hooks/useActiveDestination';
import { useCouple } from '@/hooks/useCouple';
import { cx } from '@/lib/cx';
import { TONE_CLASSES } from '@/lib/personTone';

// O topo das páginas principais. No celular é só a marca: os destinos ficam na barra de
// baixo (TabBar). A partir do md eles sobem para cá, e o seu avatar leva ao perfil.
export function AppHeader() {
  const { me } = useCouple();
  const active = useActiveDestination();
  const isProfile = active === 'profile';

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-2.5">
        <Link to="/my-list" aria-label="Ir para a sua lista" className="rounded-md">
          <Wordmark />
        </Link>
        <HeaderNav active={active} />
        <Link
          to="/profile"
          aria-label="Seu perfil"
          aria-current={isProfile ? 'page' : undefined}
          className="ml-auto hidden h-10 w-10 items-center justify-center rounded-full md:flex"
        >
          <Avatar
            person={me}
            size="md"
            className={
              isProfile && me
                ? cx('ring-2 ring-offset-2 ring-offset-canvas', TONE_CLASSES[me.tone].ring)
                : undefined
            }
          />
        </Link>
      </div>
    </header>
  );
}
