import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meQueries } from '@/api/queries';
import { groupService } from '@/api/services/groupService';
import { withOwnMember } from '@/lib/meCache';
import type { PersonTone } from '@/lib/personTone';

// Troca a sua cor na dupla na hora (otimista): o app inteiro muda de cor junto, já que as
// cores saem do /me. Toques seguidos saem em fila (scope), então vale o último. Se a API
// recusar (o par pegou essa cor no mesmo instante), o /me é buscado de novo e volta ao que
// vale. `exact`: o estado do Telegram também mora embaixo de "me" e não tem nada a ver.
export function useSetPersonColor() {
  const queryClient = useQueryClient();
  const { queryKey } = meQueries.detail();

  return useMutation({
    scope: { id: 'person-color' },
    mutationFn: (tone: PersonTone) => groupService.setColor(tone),
    onMutate: async (tone) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData(queryKey, (old) => (old ? withOwnMember(old, { cor: tone }) : old));
    },
    onError: () => queryClient.invalidateQueries({ queryKey, exact: true }),
  });
}
