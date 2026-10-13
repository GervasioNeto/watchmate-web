import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextInput } from '@/components/ui/TextInput';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'login', label: 'Entrar' },
  { value: 'signup', label: 'Criar conta' },
];

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

  function changeMode(next: Mode) {
    setMode(next);
    setError(null);
    setSignupSuccess(false);
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
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <Link to="/" aria-label="WatchMate, página inicial" className="self-start rounded-md">
        <Wordmark className="h-10" />
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {mode === 'login' ? 'Entrar na sua conta' : 'Criar uma conta'}
        </h1>
        <p className="text-sm text-fg-muted">
          {mode === 'login'
            ? 'Continue de onde vocês pararam.'
            : 'Depois você convida seu par com um código.'}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <SegmentedControl
          label="Entrar ou criar conta"
          options={MODE_OPTIONS}
          value={mode}
          onChange={changeMode}
        />

        <GoogleSignInButton onError={setError} />

        <div className="flex items-center gap-3 text-xs text-fg-subtle">
          <div className="h-px flex-1 bg-line" />
          ou com e-mail
          <div className="h-px flex-1 bg-line" />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        {signupSuccess ? (
          <p role="status" className="text-sm text-fg-muted">
            Conta criada. Confirme o cadastro pelo link que enviamos para {email} e depois entre.
          </p>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5 text-sm">
              E-mail
              <TextInput
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              Senha
              <TextInput
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <Button type="submit" isLoading={isSubmitting} className="mt-1">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
