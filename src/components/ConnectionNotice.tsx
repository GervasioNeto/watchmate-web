import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const BACK_ONLINE_MS = 2500;

// O aviso de conexão, flutuando acima da barra de baixo. Sem internet, fica enquanto durar
// (o app abre, mas os dados vêm da API); quando a conexão volta, confirma por um instante e
// some. As telas se atualizam sozinhas na volta: o React Query busca de novo ao reconectar.
export function ConnectionNotice() {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(!isOnline);
  const [isBackOnline, setIsBackOnline] = useState(false);

  if (!isOnline && !wasOffline) {
    setWasOffline(true);
    setIsBackOnline(false);
  }
  if (isOnline && wasOffline) {
    setWasOffline(false);
    setIsBackOnline(true);
  }

  useEffect(() => {
    if (!isBackOnline) return;
    const timer = window.setTimeout(() => setIsBackOnline(false), BACK_ONLINE_MS);
    return () => window.clearTimeout(timer);
  }, [isBackOnline]);

  return (
    // A região existe sempre, para o leitor de tela anunciar quando o aviso aparece.
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-6"
    >
      {!isOnline ? (
        <p className="flex max-w-sm animate-rise-in items-center gap-3 rounded-lg bg-fg py-2.5 pr-4 pl-3 text-canvas shadow-lg">
          <WifiOff size={18} aria-hidden className="shrink-0" />
          <span className="flex flex-col">
            <span className="text-sm font-bold">Sem internet</span>
            <span className="text-xs text-canvas/70">
              O WatchMate precisa de conexão para atualizar.
            </span>
          </span>
        </p>
      ) : isBackOnline ? (
        <p className="flex animate-rise-in items-center gap-2 rounded-full bg-fg py-2 pr-4 pl-3 text-sm font-bold text-canvas shadow-lg">
          <Wifi size={16} aria-hidden className="shrink-0" />
          Conexão de volta
        </p>
      ) : null}
    </div>
  );
}
