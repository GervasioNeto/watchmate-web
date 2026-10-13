import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cx } from '@/lib/cx';

// Volta no histórico; se a página foi aberta direto (sem histórico), vai para `fallback`.
export function BackButton({
  fallback = '/my-list',
  className,
}: {
  fallback?: string;
  className?: string;
}) {
  const navigate = useNavigate();

  function goBack() {
    const hasHistory = (window.history.state as { idx?: number } | null)?.idx;
    if (hasHistory) navigate(-1);
    else navigate(fallback, { replace: true });
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Voltar"
      className={cx(
        'flex h-10 w-10 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-2',
        className,
      )}
    >
      <ArrowLeft size={20} strokeWidth={2} />
    </button>
  );
}
