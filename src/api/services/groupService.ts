import { api, ApiError } from '@/api/client';
import type { Group } from '@/types/api';

export const groupService = {
  // 404 means the user hasn't joined a group yet — not an error for the UI.
  getMine: async (): Promise<Group | null> => {
    try {
      return await api.get<Group>('/groups/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },
  create: () => api.post<Group>('/groups'),
  join: (codigoConvite: string) => api.post<Group>('/groups/join', { codigoConvite }),
  updateName: (nome: string) => api.patch<Group>('/groups/me', { nome }),
};
