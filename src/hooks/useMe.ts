import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Me } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

export function useMe() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/me'),
    enabled: !!session,
  });
}

export function usePatchMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nome: string) => api.patch<Me>('/me', { nome }),
    onSuccess: (me) => {
      queryClient.setQueryData(['me'], me);
    },
  });
}
