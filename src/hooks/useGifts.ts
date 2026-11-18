import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { giftQueries } from '@/api/queries';
import { queryKeys } from '@/api/queryKeys';
import { giftService } from '@/api/services/giftService';
import type { CreateGiftInput, Gift } from '@/types/api';

// Os presentes da pessoa. Volta a buscar ao voltar para o app (é assim que um presente
// entregue enquanto o app estava fechado aparece) e a cada minuto com ele aberto: um presente
// agendado para a meia-noite chega mesmo sem push.
export function useGifts(enabled = true) {
  return useQuery({
    ...giftQueries.list(),
    enabled,
    refetchInterval: 60_000,
  });
}

// Troca um presente na lista (recebidos ou dados) pelo que a API devolveu.
function useReplaceGift() {
  const queryClient = useQueryClient();
  return (gift: Gift) => {
    queryClient.setQueryData(giftQueries.list().queryKey, (old) => {
      if (!old) return old;
      const swap = (list: Gift[]) => list.map((item) => (item.id === gift.id ? gift : item));
      return { ...old, received: swap(old.received), sent: swap(old.sent) };
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.inbox.all() });
  };
}

export function useSendGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGiftInput) => giftService.create(input),
    onSuccess: (gift) => {
      queryClient.setQueryData(giftQueries.list().queryKey, (old) =>
        old ? { ...old, sent: [gift, ...old.sent] } : old,
      );
    },
  });
}

export function useCancelGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (giftId: string) => giftService.cancel(giftId),
    onSuccess: (_, giftId) => {
      queryClient.setQueryData(giftQueries.list().queryKey, (old) =>
        old ? { ...old, sent: old.sent.filter((gift) => gift.id !== giftId) } : old,
      );
    },
  });
}

export function useOpenGift() {
  const replace = useReplaceGift();
  return useMutation({
    mutationFn: (giftId: string) => giftService.open(giftId),
    onSuccess: replace,
  });
}

export function useReactToGift() {
  const replace = useReplaceGift();
  return useMutation({
    mutationFn: ({ giftId, emoji }: { giftId: string; emoji: string }) =>
      giftService.react(giftId, emoji),
    onSuccess: replace,
  });
}

export function useUseVoucher() {
  const replace = useReplaceGift();
  return useMutation({
    mutationFn: ({ giftId, voucherId }: { giftId: string; voucherId: string }) =>
      giftService.useVoucher(giftId, voucherId),
    onSuccess: replace,
  });
}
