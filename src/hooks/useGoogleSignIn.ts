import { useEffect, useRef } from 'react';

import { createGoogleNonce, signInWithGoogle } from '@/lib/googleAuth';

interface UseGoogleSignInProps {
  onError: (message: string) => void;
}

export function useGoogleSignIn(
  containerRef: React.RefObject<HTMLDivElement | null>,
  { onError }: UseGoogleSignInProps,
) {
  const lastWidthRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const container = containerRef.current;

      if (!clientId || !container || !window.google) {
        return;
      }

      const { rawNonce, hashedNonce } = await createGoogleNonce();

      if (cancelled) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        callback: (response) => {
          void (async () => {
            const { error } = await signInWithGoogle(response.credential, rawNonce);

            if (error) {
              onError(error.message);
            }
          })();
        },
      });

      const width = Math.min(400, Math.max(200, container.offsetWidth));

      lastWidthRef.current = width;

      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: String(width),
        text: 'continue_with',
        locale: 'pt-BR',
        shape: 'pill',
      });
    }

    function loadGoogleButton() {
      if (window.google?.accounts?.id) {
        void render();
        return;
      }

      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="accounts.google.com/gsi/client"]',
      );

      script?.addEventListener('load', () => void render(), {
        once: true,
      });
    }

    loadGoogleButton();

    const container = containerRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = Math.round(entries[0].contentRect.width);

      if (newWidth === 0 || newWidth === lastWidthRef.current) {
        return;
      }

      container?.replaceChildren();

      void render();
    });

    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [containerRef, onError]);
}
