import { api } from '@/api/client';
import type { Me, User } from '@/types/api';

export interface UpdateAvatarInput {
  estilo: string;
  semente: string;
}

export const meService = {
  get: () => api.get<Me>('/me'),
  updateName: (nome: string) => api.patch<Me>('/me', { nome }),
  updateAvatar: (input: UpdateAvatarInput) => api.patch<User>('/me/avatar', input),
};
