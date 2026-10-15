import { Link } from 'react-router-dom';
import { DestinationIcon } from '@/components/navigation/DestinationIcon';
import { cx } from '@/lib/cx';
import { DESTINATIONS, type DestinationId } from '@/lib/destinations';

// Os destinos no cabeçalho, a partir do md (no celular eles ficam na TabBar). O perfil não
// entra aqui: ele é o avatar no canto do cabeçalho.
const HEADER_DESTINATIONS = DESTINATIONS.filter((destination) => destination.id !== 'profile');

export function HeaderNav({ active }: { active: DestinationId | null }) {
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {HEADER_DESTINATIONS.map((destination) => {
        const isActive = destination.id === active;
        return (
          <Link
            key={destination.id}
            to={destination.to}
            aria-current={isActive ? 'page' : undefined}
            className={cx(
              'flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors',
              isActive ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            <DestinationIcon id={destination.id} active={isActive} size={18} />
            {destination.label}
          </Link>
        );
      })}
    </nav>
  );
}
