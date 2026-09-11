import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { Group } from '@/types/api';

export function useGroup() {
  return useQuery({
    queryKey: ['group'],
    queryFn: async () => {
      try {
        return await api.get<Group>('/groups/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Group>('/groups'),
    onSuccess: (group) => {
      queryClient.setQueryData(['group'], group);
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (codigoConvite: string) => api.post<Group>('/groups/join', { codigoConvite }),
    onSuccess: (group) => {
      queryClient.setQueryData(['group'], group);
    },
  });
}
