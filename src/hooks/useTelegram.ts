import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meQueries } from '@/api/queries';
import { telegramService } from '@/api/services/telegramService';

// Enquanto espera o "Iniciar" no Telegram, confere de tempos em tempos: a conexão aparece
// sozinha, sem a pessoa precisar recarregar. Voltar para a aba também confere na hora.
const PENDING_REFETCH_MS = 3000;

export function useTelegramState() {
  return useQuery({
    ...meQueries.telegram(),
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? PENDING_REFETCH_MS : false,
  });
}

// Ligar ou desligar. A resposta já é o estado novo, então vai direto para o cache.
export function useSetTelegram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (on: boolean) => (on ? telegramService.turnOn() : telegramService.turnOff()),
    onSuccess: (state) => queryClient.setQueryData(meQueries.telegram().queryKey, state),
  });
}
