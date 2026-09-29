import { useRef } from 'react';

import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGoogleSignIn(containerRef, { onError });

  return <div ref={containerRef} className="flex w-full justify-center" />;
}
