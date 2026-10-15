import { Outlet } from 'react-router-dom';
import { ConnectionNotice } from '@/components/ConnectionNotice';
import { TabBar } from '@/components/navigation/TabBar';
import { RequireAuth } from '@/routes/RequireAuth';

// A casca das páginas de quem já entrou: a barra de destinos no celular (com o espaço dela
// reservado no fim de cada página) e o aviso de conexão.
export function AppLayout() {
  return (
    <RequireAuth>
      <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </div>
      <ConnectionNotice />
      <TabBar />
    </RequireAuth>
  );
}
