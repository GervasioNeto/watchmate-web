import { api } from '@/api/client';
import type { Me } from '@/types/api';

export const meService = {
  get: () => api.get<Me>('/me'),
  updateName: (nome: string) => api.patch<Me>('/me', { nome }),
};
