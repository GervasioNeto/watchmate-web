import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupQueries } from '@/api/queries';
import { queryKeys } from '@/api/queryKeys';
import { groupService } from '@/api/services/groupService';
import type { Group } from '@/types/api';

export function useGroup() {
  return useQuery(groupQueries.mine());
}

function useSetGroupOnSuccess() {
  const queryClient = useQueryClient();
  return (group: Group) => {
    queryClient.setQueryData(groupQueries.mine().queryKey, group);
  };
}

export function useCreateGroup() {
  const setGroup = useSetGroupOnSuccess();
  return useMutation({
    mutationFn: groupService.create,
    onSuccess: setGroup,
  });
}

export function useJoinGroup() {
  const setGroup = useSetGroupOnSuccess();
  return useMutation({
    mutationFn: groupService.join,
    onSuccess: setGroup,
  });
}

export function usePatchGroup() {
  const queryClient = useQueryClient();
  const setGroup = useSetGroupOnSuccess();
  return useMutation({
    mutationFn: groupService.updateName,
    onSuccess: (group) => {
      setGroup(group);
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}
