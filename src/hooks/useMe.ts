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

// Reactions and comments only carry id/nome, so avatars there are resolved
// from the group members that GET /me already returns.
export function useFindGroupMember() {
  const { data: me } = useMe();
  const members = me?.membroDoGrupo?.grupo.membros ?? [];
  return (userId: string) => members.find((member) => member.usuario.id === userId)?.usuario;
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meService.updateAvatar,
    onSuccess: ({ avatarEstilo, avatarSemente }) => {
      // Atualiza tanto o topo do /me quanto a própria entrada em
      // membroDoGrupo.grupo.membros, que é de onde a dupla é desenhada.
      queryClient.setQueryData(meQueries.detail().queryKey, (old) => {
        if (!old) return old;
        const avatar = { avatarEstilo, avatarSemente };
        const grupo = old.membroDoGrupo?.grupo;
        return {
          ...old,
          ...avatar,
          membroDoGrupo: grupo
            ? {
                grupo: {
                  ...grupo,
                  membros: grupo.membros.map((member) =>
                    member.usuario.id === old.id
                      ? { usuario: { ...member.usuario, ...avatar } }
                      : member,
                  ),
                },
              }
            : old.membroDoGrupo,
        };
      });
    },
  });
}
