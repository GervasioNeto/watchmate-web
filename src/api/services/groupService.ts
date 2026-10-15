import { api, ApiError } from '@/api/client';
import type { Group, GroupMember, NoteFields } from '@/types/api';

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
  // The caller's note to their partner. Returns the caller's membership with the new note.
  saveNote: (texto: string) => api.put<GroupMember & NoteFields>('/groups/me/note', { texto }),
  clearNote: () => api.delete<void>('/groups/me/note'),
  // Your color in the pair, a palette id. 409 when your partner already uses it.
  setColor: (cor: string) => api.patch<GroupMember>('/groups/me/color', { cor }),
};
