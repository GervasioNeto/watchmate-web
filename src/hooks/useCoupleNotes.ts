import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meQueries } from '@/api/queries';
import { groupService } from '@/api/services/groupService';
import { useMe } from '@/hooks/useMe';
import { withOwnMember } from '@/lib/meCache';
import { toNote, type Note } from '@/lib/notes';
import type { NoteFields } from '@/types/api';

// Os recados vêm junto com os membros do grupo no /me: chegam sem busca extra e são
// atualizados quando o /me é buscado de novo (ao voltar para a aba, por exemplo).
export function useCoupleNotes(): { mine: Note | null; partner: Note | null } {
  const { data: me } = useMe();
  return useMemo(() => {
    const members = me?.membroDoGrupo?.grupo.membros ?? [];
    const mine = members.find((member) => member.usuario.id === me?.id);
    const partner = members.find((member) => member.usuario.id !== me?.id);
    return {
      mine: mine ? toNote(mine) : null,
      partner: partner ? toNote(partner) : null,
    };
  }, [me]);
}

// Salva o seu recado (texto já normalizado) ou apaga com null. Não é otimista: o editor
// fica aberto até a API confirmar, para um erro não sumir com o que a pessoa escreveu.
export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string | null): Promise<NoteFields> => {
      if (text === null) {
        await groupService.clearNote();
        return { recado: null, recadoEm: null };
      }
      const { recado, recadoEm } = await groupService.saveNote(text);
      return { recado, recadoEm };
    },
    onSuccess: (note) => {
      queryClient.setQueryData(meQueries.detail().queryKey, (old) =>
        old ? withOwnMember(old, note) : old,
      );
    },
  });
}

const SEEN_PREFIX = 'watchmate:recado-visto:';

function readSeen(ownerId: string | null): number | null {
  if (!ownerId) return null;
  try {
    const value = Number(localStorage.getItem(SEEN_PREFIX + ownerId));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeSeen(ownerId: string, at: number) {
  try {
    localStorage.setItem(SEEN_PREFIX + ownerId, String(at));
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): o aviso de "novo" só deixa de existir.
  }
}

// O par trocou o recado desde a última vez que você abriu a lista? O que já tinha sido
// visto é lido ao abrir, então o aviso continua até você sair da página. Fica guardado
// neste navegador: é só uma conveniência, não precisa valer entre aparelhos.
export function useIsNewNote(ownerId: string | null, note: Note | null): boolean {
  const [seen, setSeen] = useState(() => ({ ownerId, at: readSeen(ownerId) }));
  if (seen.ownerId !== ownerId) {
    setSeen({ ownerId, at: readSeen(ownerId) });
  }

  const at = note?.at.getTime() ?? null;
  useEffect(() => {
    if (ownerId && at !== null) writeSeen(ownerId, at);
  }, [ownerId, at]);

  return at !== null && (seen.at === null || at > seen.at);
}
