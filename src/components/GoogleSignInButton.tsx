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

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: '320',
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

    return () => {
      cancelled = true;
    };
  }, [onError]);

  return <div ref={containerRef} className="flex justify-center" />;
}
