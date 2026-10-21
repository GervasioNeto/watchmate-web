import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inboxQueries } from '@/api/queries';
import { inboxService } from '@/api/services/inboxService';
import { clearDeliveredNotifications, setAppBadge } from '@/lib/deviceNotifications';

export function useInbox() {
  return useQuery(inboxQueries.list());
}

// Quantos avisos novos há em "Entre vocês": o pontinho no ícone de pipoca. Volta a buscar
// ao voltar para o app e a cada minuto com ele aberto, para quem não recebe push.
export function useInboxUnseen(enabled = true) {
  return useQuery({
    ...inboxQueries.unseen(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

// O número no ícone do app instalado acompanha a contagem.
export function useAppBadge(unseen: number | undefined) {
  useEffect(() => {
    if (unseen !== undefined) setAppBadge(unseen);
  }, [unseen]);
}

// Abriu a tela: o que chegou deixa de ser novo, aqui e nos outros aparelhos (a API guarda
// a hora). A lista não é buscada de novo: o destaque dos novos fica até você sair.
export function useMarkInboxSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inboxService.markSeen,
    onSuccess: () => {
      queryClient.setQueryData(inboxQueries.unseen().queryKey, 0);
      void clearDeliveredNotifications();
    },
  });
}
