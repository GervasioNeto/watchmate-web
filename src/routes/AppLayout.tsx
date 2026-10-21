import { Outlet } from 'react-router-dom';
import { ConnectionNotice } from '@/components/ConnectionNotice';
import { TabBar } from '@/components/navigation/TabBar';
import { useAppBadge, useInboxUnseen } from '@/hooks/useInbox';
import { usePushSync } from '@/hooks/usePushNotifications';
import { usePushUpdates } from '@/hooks/usePushUpdates';
import { RequireAuth } from '@/routes/RequireAuth';

// A casca das páginas de quem já entrou: a barra de destinos no celular (com o espaço dela
// reservado no fim de cada página), o aviso de conexão, a inscrição de push em dia e o que
// chega por push com o app aberto.
export function AppLayout() {
  return (
    <RequireAuth>
      <PushSync />
      <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </div>
      <ConnectionNotice />
      <TabBar />
    </RequireAuth>
  );
}

// Com a sessão garantida (dentro do RequireAuth): confere a inscrição de push deste aparelho
// uma vez por abertura do app (ver usePushSync), busca de novo o que um push muda com o app
// aberto (usePushUpdates) e mantém o número no ícone do app em dia com "Entre vocês".
function PushSync() {
  usePushSync();
  usePushUpdates();
  const { data: unseen } = useInboxUnseen();
  useAppBadge(unseen);
  return null;
}
