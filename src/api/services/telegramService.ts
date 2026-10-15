import { api } from '@/api/client';
import type { TelegramState } from '@/types/api';

export const telegramService = {
  get: () => api.get<TelegramState>('/me/telegram'),
  // Com a conta já conectada, religa na hora; senão devolve o link (linkUrl) para o Telegram.
  turnOn: () => api.post<TelegramState>('/me/telegram'),
  // Desliga os avisos (a conta continua conectada) ou cancela uma conexão pela metade.
  turnOff: () => api.delete<TelegramState>('/me/telegram'),
};
