import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meQueries } from '@/api/queries';
import { meService } from '@/api/services/meService';
import { useAuth } from '@/context/AuthContext';

export function useMe() {
  const { session } = useAuth();
  return useQuery({
    ...meQueries.detail(),
    enabled: !!session,
  });
}

export function usePatchMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meService.updateName,
    onSuccess: (updatedMe) => {
      // Faz merge em vez de sobrescrever: o PATCH pode devolver só os campos
      // simples do usuário, sem o relacionamento membroDoGrupo.grupo.membros
      // que o GET /me inclui — sobrescrever tudo apagaria essa parte do cache.
      queryClient.setQueryData(meQueries.detail().queryKey, (old) =>
        old ? { ...old, ...updatedMe } : updatedMe,
      );
    },
  });
}
