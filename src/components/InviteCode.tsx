import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Sem permissão de área de transferência: o código continua visível para copiar à mão.
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xl font-semibold tracking-[0.2em] select-all">{code}</span>
      <IconButton aria-label={copied ? 'Código copiado' : 'Copiar código'} onClick={copy}>
        {copied ? <Check size={18} className="text-fg" /> : <Copy size={18} />}
      </IconButton>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copiado' : ''}
      </span>
    </div>
  );
}
