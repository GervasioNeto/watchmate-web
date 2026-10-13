import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meQueries } from '@/api/queries';
import { meService } from '@/api/services/meService';
import { useAuth } from '@/context/AuthContext';
import type { AvatarFields, Me } from '@/types/api';

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

// Atualiza tanto o topo do /me quanto a própria entrada em
// membroDoGrupo.grupo.membros, para o cache ficar consistente.
function withAvatar(me: Me, avatar: AvatarFields): Me {
  const grupo = me.membroDoGrupo?.grupo;
  return {
    ...me,
    ...avatar,
    membroDoGrupo: grupo
      ? {
          grupo: {
            ...grupo,
            membros: grupo.membros.map((member) =>
              member.usuario.id === me.id ? { usuario: { ...member.usuario, ...avatar } } : member,
            ),
          },
        }
      : me.membroDoGrupo,
  };
}

const avatarMutationKey = ['me', 'avatar'] as const;

// O avatar troca na hora (otimista). Com vários cliques seguidos, vale o último:
// só a última mutation a terminar aplica a resposta, e qualquer erro busca o /me de novo.
export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const { queryKey } = meQueries.detail();

  return useMutation({
    mutationKey: avatarMutationKey,
    mutationFn: meService.updateAvatar,
    onMutate: async ({ estilo, semente }) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, (old) =>
        old ? withAvatar(old, { avatarEstilo: estilo, avatarSemente: semente }) : old,
      );
    },
    onSettled: async (user, error) => {
      // Durante o onSettled a própria mutation ainda conta como em andamento.
      if (queryClient.isMutating({ mutationKey: avatarMutationKey }) > 1) return;
      if (error || !user) {
        await queryClient.invalidateQueries({ queryKey });
        return;
      }
      queryClient.setQueryData(queryKey, (old) =>
        old
          ? withAvatar(old, { avatarEstilo: user.avatarEstilo, avatarSemente: user.avatarSemente })
          : old,
      );
    },
  });
}
