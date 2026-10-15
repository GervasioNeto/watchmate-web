import { api } from '@/api/client';

export const pushService = {
  // A chave com que o aparelho se inscreve. Null: a API está sem push, e a opção some.
  getPublicKey: () => api.get<{ publicKey: string | null }>('/push/public-key'),
  // Liga os avisos neste aparelho. Mandar de novo a mesma inscrição é seguro.
  subscribe: (subscription: PushSubscriptionJSON) =>
    api.post<void>('/me/push-subscriptions', subscription),
  unsubscribe: (endpoint: string) => api.delete<void>('/me/push-subscriptions', { endpoint }),
};
