import { Outlet, ScrollRestoration } from 'react-router-dom';

// Em volta de todas as páginas. Cada página nova começa do topo, e o "voltar" devolve a
// rolagem de onde a pessoa estava (da série de volta para a lista, por exemplo).
export function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
