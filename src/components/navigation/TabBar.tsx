import type { MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DestinationIcon } from '@/components/navigation/DestinationIcon';
import { cx } from '@/lib/cx';
import { DESTINATIONS, destinationOf, type Destination } from '@/lib/destinations';
import { scrollBehavior } from '@/lib/motion';

// Tocar no destino em que você já está volta a página para o topo, como nos apps.
function scrollToTop(event: MouseEvent, destination: Destination, pathname: string) {
  if (pathname !== destination.to) return;
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

// A navegação no celular: os quatro destinos embaixo, perto do dedo. Fica por cima do
// conteúdo, com o fundo da página levemente transparente, e respeita a faixa do gesto de
// início do iPhone. A partir do md some, e os destinos sobem para o cabeçalho (AppHeader).
export function TabBar() {
  const { pathname } = useLocation();
  const active = destinationOf(pathname);

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg select-none md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {DESTINATIONS.map((destination) => {
          const isActive = destination.id === active;
          return (
            <li key={destination.id}>
              <Link
                to={destination.to}
                aria-current={pathname === destination.to ? 'page' : undefined}
                onClick={(event) => scrollToTop(event, destination, pathname)}
                className={cx(
                  'group flex h-14 flex-col items-center justify-center gap-1 rounded-md transition-colors [-webkit-touch-callout:none]',
                  isActive ? 'text-fg' : 'text-fg-subtle',
                )}
              >
                <span className="flex h-6 items-center justify-center transition-transform duration-150 ease-out group-active:scale-90">
                  <DestinationIcon id={destination.id} active={isActive} />
                </span>
                <span className="text-[11px] leading-none font-semibold">{destination.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
