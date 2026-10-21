import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { inviteQueries } from '@/api/queries';
import { queryKeys } from '@/api/queryKeys';
import { inviteService } from '@/api/services/inviteService';
import { isLiveInvite } from '@/lib/invites';
import type { CreateInviteInput, Invite, InviteAnswer } from '@/types/api';

// Quanto o ingresso fica na tela com o carimbo ("Hoje não", "Cancelado") antes de sair.
const STAMP_LINGER_MS = 1800;

// O convite do momento da dupla. Enquanto há um vivo, a busca se repete com o app aberto:
// sem push (ou com o aviso perdido), a resposta do par ainda chega sozinha.
export function useActiveInvite(enabled = true) {
  return useQuery({
    ...inviteQueries.active(),
    enabled,
    refetchInterval: (query) => (query.state.data ? 30_000 : false),
  });
}

// Depois de mandar, responder ou cancelar: o convite que voltou vira o do topo. Se ele não
// vale mais (recusado, cancelado), fica um instante com o carimbo e então sai.
function useApplyInvite() {
  const queryClient = useQueryClient();
  const { queryKey } = inviteQueries.active();
  return (invite: Invite) => {
    const { id } = invite;
    queryClient.setQueryData(queryKey, invite);
    if (!isLiveInvite(invite)) {
      setTimeout(() => {
        // Só tira se ainda for este: um convite novo nesse meio-tempo fica.
        if (queryClient.getQueryData(queryKey)?.id === id) {
          queryClient.setQueryData(queryKey, null);
        }
      }, STAMP_LINGER_MS);
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.all() });
  };
}

// 409: o convite mudou por outro caminho (respondido no outro aparelho, expirou). O que
// está na tela é buscado de novo.
function useRefreshOnConflict() {
  const queryClient = useQueryClient();
  return (error: Error) => {
    if (error instanceof ApiError && error.status === 409) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invites.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.all() });
    }
  };
}

export function useSendInvite() {
  const apply = useApplyInvite();
  return useMutation({
    mutationFn: (input: CreateInviteInput) => inviteService.create(input),
    onSuccess: apply,
  });
}

export function useAnswerInvite() {
  const apply = useApplyInvite();
  const refresh = useRefreshOnConflict();
  return useMutation({
    mutationFn: ({ inviteId, answer }: { inviteId: string; answer: InviteAnswer }) =>
      inviteService.answer(inviteId, answer),
    onSuccess: apply,
    onError: refresh,
  });
}

export function useCancelInvite() {
  const apply = useApplyInvite();
  const refresh = useRefreshOnConflict();
  return useMutation({
    mutationFn: (inviteId: string) => inviteService.cancel(inviteId),
    onSuccess: apply,
    onError: refresh,
  });
}
