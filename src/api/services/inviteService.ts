import { api } from '@/api/client';
import type { CreateInviteInput, Invite, InviteAnswer } from '@/types/api';

export const inviteService = {
  // O convite do momento da dupla (o ingresso no topo da lista), ou null.
  active: () => api.get<Invite | null>('/invites/active'),
  create: (input: CreateInviteInput) => api.post<Invite>('/invites', input),
  answer: (inviteId: string, answer: InviteAnswer) =>
    api.post<Invite>(`/invites/${inviteId}/answer`, answer),
  cancel: (inviteId: string) => api.post<Invite>(`/invites/${inviteId}/cancel`),
};
