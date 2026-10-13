import { supabase } from '@/lib/supabase';

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function createGoogleNonce() {
  const rawNonce = crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);

  return {
    rawNonce,
    hashedNonce,
  };
}

export async function signInWithGoogle(credential: string, nonce: string) {
  return supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential,
    nonce,
  });
}
