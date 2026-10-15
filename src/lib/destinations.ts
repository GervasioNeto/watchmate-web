// Os quatro destinos do app. A barra de baixo (celular) e o cabeçalho (computador) saem
// desta lista. Cada página pertence a um destino, e é ele que fica aceso enquanto ela está
// aberta: a página de uma série abre a partir da lista, então acende a lista.
export type DestinationId = 'list' | 'search' | 'couple' | 'profile';

export interface Destination {
  id: DestinationId;
  label: string;
  to: string;
}

export const DESTINATIONS: readonly Destination[] = [
  { id: 'list', label: 'Lista', to: '/my-list' },
  { id: 'search', label: 'Buscar', to: '/series/add' },
  { id: 'couple', label: 'Dupla', to: '/couple' },
  { id: 'profile', label: 'Perfil', to: '/profile' },
];

export function destinationOf(pathname: string): DestinationId | null {
  const exact = DESTINATIONS.find((destination) => destination.to === pathname);
  if (exact) return exact.id;
  if (pathname.startsWith('/series/')) return 'list';
  return null;
}
