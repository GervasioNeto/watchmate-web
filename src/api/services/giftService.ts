import { api } from '@/api/client';
import type { CreateGiftInput, Gift, GiftsResponse } from '@/types/api';

export const giftService = {
  list: () => api.get<GiftsResponse>('/gifts'),
  create: (input: CreateGiftInput) => api.post<Gift>('/gifts', input),
  // Só antes da entrega: entregue, o presente já é de quem recebeu.
  cancel: (giftId: string) => api.delete<void>(`/gifts/${giftId}`),
  open: (giftId: string) => api.post<Gift>(`/gifts/${giftId}/open`),
  react: (giftId: string, emoji: string) => api.post<Gift>(`/gifts/${giftId}/react`, { emoji }),
  useVoucher: (giftId: string, voucherId: string) =>
    api.post<Gift>(`/gifts/${giftId}/vouchers/${voucherId}/use`),
};
