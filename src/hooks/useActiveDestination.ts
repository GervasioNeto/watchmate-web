import { useLocation } from 'react-router-dom';
import { destinationOf } from '@/lib/destinations';

// O destino aceso agora, pela página aberta (ver lib/destinations.ts).
export function useActiveDestination() {
  const { pathname } = useLocation();
  return destinationOf(pathname);
}
