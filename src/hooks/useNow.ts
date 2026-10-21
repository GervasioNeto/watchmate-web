import { useEffect, useState } from 'react';

// A hora, atualizada de tempos em tempos: para o que muda sozinho na tela ("Começa em 40
// min", "há 5 min") sem esperar outra coisa redesenhar.
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
