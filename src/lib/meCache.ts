import type { GroupMemberSummary, Me } from '@/types/api';

// Troca campos da sua entrada em membroDoGrupo.grupo.membros (recado, cor), deixando o
// resto do /me intacto. Usado nas atualizações do cache depois de mudar algo seu no grupo.
export function withOwnMember(
  me: Me,
  changes: Partial<Pick<GroupMemberSummary, 'recado' | 'recadoEm' | 'cor'>>,
): Me {
  const grupo = me.membroDoGrupo?.grupo;
  if (!grupo) return me;
  return {
    ...me,
    membroDoGrupo: {
      grupo: {
        ...grupo,
        membros: grupo.membros.map((member) =>
          member.usuario.id === me.id ? { ...member, ...changes } : member,
        ),
      },
    },
  };
}
