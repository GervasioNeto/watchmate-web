import { api } from '@/api/client';
import type { InboxItem } from '@/types/api';

export const inboxService = {
  list: async () => (await api.get<{ items: InboxItem[] }>('/me/inbox')).items,
  unseen: async () => (await api.get<{ unseen: number }>('/me/inbox/unseen')).unseen,
  markSeen: () => api.post<void>('/me/inbox/seen'),
};
