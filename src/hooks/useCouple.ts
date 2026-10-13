import { useMemo } from 'react';
import { useMe } from '@/hooks/useMe';
import { buildCouple } from '@/lib/people';

// Você e seu par, a partir do /me. `partner` é null enquanto ninguém entrou no grupo.
export function useCouple() {
  const { data: me, isLoading } = useMe();
  const couple = useMemo(() => buildCouple(me), [me]);
  return { ...couple, isLoading };
}
