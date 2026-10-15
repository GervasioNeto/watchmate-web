import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Tocar num aviso com o app já aberto: o service worker traz o app para a frente e manda a
// tela (ver openApp no public/sw.js). A navegação é a do próprio app, sem recarregar.
export function useNotificationNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const { type, path } = (event.data ?? {}) as { type?: unknown; path?: unknown };
      if (type === 'navigate' && typeof path === 'string' && path.startsWith('/')) {
        navigate(path);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [navigate]);
}
