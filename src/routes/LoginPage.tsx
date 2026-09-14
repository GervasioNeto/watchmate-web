import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Wordmark } from '@/components/Wordmark';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

export function LoginPage() {
  const { session, isLoading: isSessionLoading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (!isSessionLoading && session) {
    return <Navigate to="/my-list" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: authError } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === 'signup') {
      setSignupSuccess(true);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="mb-8">
        <Wordmark />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-raised p-6">
        <div className="mb-6 flex gap-1 rounded-xl bg-surface p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === 'login' ? 'bg-flame text-white' : 'text-neutral-400'
            }`}
            onClick={() => {
              setMode('login');
              setError(null);
              setSignupSuccess(false);
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === 'signup' ? 'bg-flame text-white' : 'text-neutral-400'
            }`}
            onClick={() => {
              setMode('signup');
              setError(null);
              setSignupSuccess(false);
            }}
          >
            Criar conta
          </button>
        </div>

        {signupSuccess ? (
          <p className="text-center text-sm text-neutral-300">
            Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.
          </p>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5 text-sm text-neutral-300">
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-white outline-none focus:border-flame"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-neutral-300">
              Senha
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-white outline-none focus:border-flame"
              />
            </label>

            {error && <p className="text-sm text-fuchsia">{error}</p>}

            <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
