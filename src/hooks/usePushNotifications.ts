import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pushQueries } from '@/api/queries';
import { queryKeys } from '@/api/queryKeys';
import { pushService } from '@/api/services/pushService';
import { useCouple } from '@/hooks/useCouple';
import {
  getDeviceSubscription,
  isPushSupported,
  needsInstallForPush,
  notificationPermission,
  showWelcomeNotification,
  subscribeDevice,
  unsubscribeDevice,
} from '@/lib/push';

// Os avisos por push neste aparelho:
// - loading: ainda descobrindo;
// - unavailable: a API está sem push ou o navegador não recebe; a opção some;
// - needs-install: iPhone no Safari, onde só o app instalado recebe;
// - denied: a pessoa bloqueou as notificações do site no navegador;
// - off e on.
export type PushStatus = 'loading' | 'unavailable' | 'needs-install' | 'denied' | 'off' | 'on';

// A permissão também muda fora do app (nas configurações do navegador): acompanha.
function useNotificationPermission() {
  const [permission, setPermission] = useState(notificationPermission);

  useEffect(() => {
    if (!isPushSupported() || !navigator.permissions) return;
    let cancelled = false;
    let status: PermissionStatus | null = null;
    const update = () => setPermission(notificationPermission());
    navigator.permissions
      .query({ name: 'notifications' })
      .then((result) => {
        if (cancelled) return;
        status = result;
        result.addEventListener('change', update);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      status?.removeEventListener('change', update);
    };
  }, []);

  return [permission, setPermission] as const;
}

export function usePushNotifications() {
  const queryClient = useQueryClient();
  const { partner } = useCouple();
  const { data: config, isPending: isConfigPending } = useQuery(pushQueries.publicKey());
  const publicKey = config?.publicKey ?? null;
  const [permission, setPermission] = useNotificationPermission();
  const canReceive = publicKey !== null && isPushSupported();

  // Pergunta ao navegador a cada vez que o perfil abre (é rápido e local): depois de sair e
  // entrar com outra conta, o estado guardado já não valeria.
  const device = useQuery({
    queryKey: queryKeys.push.device(),
    queryFn: async () => (await getDeviceSubscription(publicKey!)) !== null,
    enabled: canReceive && permission === 'granted',
  });
  const setDeviceOn = (on: boolean) => queryClient.setQueryData(queryKeys.push.device(), on);

  // Ligar: a permissão do navegador, a inscrição do aparelho e a API, nessa ordem. No fim,
  // o primeiro aviso chega na hora, como confirmação.
  const turnOn = useMutation({
    mutationFn: async () => {
      const subscription = await subscribeDevice(publicKey!);
      setPermission(notificationPermission());
      if (!subscription) return false;
      await pushService.subscribe(subscription.toJSON());
      await showWelcomeNotification(partner?.shortName ?? null).catch(() => undefined);
      return true;
    },
    onSuccess: setDeviceOn,
  });

  // Desligar: o aparelho para de receber na hora. Se a API não ouvir agora (sem rede), ela
  // apaga a inscrição sozinha no próximo aviso, quando o serviço de push recusar.
  const turnOff = useMutation({
    mutationFn: async () => {
      const endpoint = await unsubscribeDevice();
      if (endpoint) await pushService.unsubscribe(endpoint).catch(() => undefined);
      return false;
    },
    onSuccess: setDeviceOn,
  });

  // Primeiro o que o navegador sabe fazer, depois quem ele diz ser: o Safari do iPhone só tem
  // push no app instalado, então sem push ali o caminho é instalar. (Olhar só o "é iPhone"
  // erraria no simulador de celular do computador, que finge ser iPhone e tem push.)
  let status: PushStatus;
  if (isConfigPending) status = 'loading';
  else if (publicKey === null) status = 'unavailable';
  else if (!isPushSupported()) status = needsInstallForPush() ? 'needs-install' : 'unavailable';
  else if (permission === 'denied') status = 'denied';
  else if (permission === 'granted' && device.isPending) status = 'loading';
  else status = device.data ? 'on' : 'off';

  return {
    status,
    // O que o switch mostra: enquanto liga ou desliga, já o estado novo.
    isOn: turnOn.isPending || (!turnOff.isPending && status === 'on'),
    turnOn: () => turnOn.mutate(),
    turnOff: () => turnOff.mutate(),
    isBusy: turnOn.isPending || turnOff.isPending,
    isError: turnOn.isError || turnOff.isError,
  };
}

// Ao abrir o app: se este aparelho recebe push, manda a inscrição de novo para a API. O
// navegador troca a inscrição de tempos em tempos, e a API apaga as que expiram: assim ela
// sempre tem a atual, sem a pessoa precisar religar.
export function usePushSync() {
  const { data: config } = useQuery(pushQueries.publicKey());
  const publicKey = config?.publicKey ?? null;

  useEffect(() => {
    if (!publicKey) return;
    getDeviceSubscription(publicKey)
      .then((subscription) => subscription && pushService.subscribe(subscription.toJSON()))
      .catch(() => undefined);
  }, [publicKey]);
}
