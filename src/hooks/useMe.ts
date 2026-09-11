import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

export function useMe() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<User>('/me'),
    enabled: !!session,
  });
}
