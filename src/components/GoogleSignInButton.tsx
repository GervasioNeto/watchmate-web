import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || !containerRef.current || !window.google) {
        return;
      }

      // O nonce hasheado vai pro Google, o original (não hasheado) vai pro Supabase depois —
      // é assim que o signInWithIdToken confirma que o ID token foi emitido pra essa tentativa de login.
      const rawNonce = crypto.randomUUID();
      const hashedNonce = await sha256Hex(rawNonce);
      if (cancelled) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        callback: (response) => {
          void (async () => {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce: rawNonce,
            });
            if (error) {
              onError(error.message);
            }
          })();
        },
      });

      // A largura do botão do Google é um valor fixo em px, não responsivo — medimos
      // o container pra ele nunca ficar maior que a tela (limites 200-400 documentados
      // pelo Google Identity Services).
      const width = Math.min(400, Math.max(200, containerRef.current.offsetWidth));
      lastWidthRef.current = width;

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: String(width),
        text: 'continue_with',
        locale: 'pt-BR',
      });
    }

    if (window.google?.accounts?.id) {
      void render();
    } else {
      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="accounts.google.com/gsi/client"]',
      );
      script?.addEventListener('load', () => void render(), { once: true });
    }

    // Reobserva só a largura real do container (não o iframe do botão em si,
    // pra não entrar num loop de resize causado pelo próprio render).
    const container = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = Math.round(entries[0].contentRect.width);
      if (newWidth === 0 || newWidth === lastWidthRef.current) return;
      container?.replaceChildren();
      void render();
    });
    if (container) resizeObserver.observe(container);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [onError]);

  return <div ref={containerRef} className="flex w-full justify-center" />;
}
