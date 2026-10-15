import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useNotificationNavigation } from '@/hooks/useNotificationNavigation';

// Em volta de todas as páginas. Cada página nova começa do topo, e o "voltar" devolve a
// rolagem de onde a pessoa estava (da série de volta para a lista, por exemplo). Também
// leva até a tela de um aviso tocado com o app aberto.
export function RootLayout() {
  useNotificationNavigation();

  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
