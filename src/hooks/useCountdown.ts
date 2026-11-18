import { useEffect, useState } from 'react';

// Quanto falta (em ms) até `target` (uma data ISO), atualizado a cada segundo enquanto não
// chega. 0 quando chegou; null sem data. Para de contar sozinho no zero.
export function useCountdown(target: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());
  const end = target ? Date.parse(target) : null;
  const running = end !== null && end > now;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  return end === null ? null : Math.max(0, end - now);
}
