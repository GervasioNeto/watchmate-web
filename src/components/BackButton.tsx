import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BackButton({ className = '' }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Voltar"
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-border hover:text-white ${className}`}
    >
      <ArrowLeft size={20} strokeWidth={2} />
    </button>
  );
}
