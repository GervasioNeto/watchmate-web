import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Me } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

export function useMe() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/me'),
    enabled: !!session,
  });
}

export function usePatchMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nome: string) => api.patch<Me>('/me', { nome }),
    onSuccess: (updatedMe) => {
      // Faz merge em vez de sobrescrever: o PATCH pode devolver só os campos
      // simples do usuário, sem o relacionamento membroDoGrupo.grupo.membros
      // que o GET /me inclui — sobrescrever tudo apagaria essa parte do cache.
      queryClient.setQueryData<Me>(['me'], (old) => (old ? { ...old, ...updatedMe } : updatedMe));
    },
  });
}
