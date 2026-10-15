import { pushService } from '@/api/services/pushService';
import { unsubscribeDevice } from '@/lib/push';
import { supabase } from '@/lib/supabase';

// Quanto o desligamento do push pode segurar a saída, no pior caso (sem rede).
const PUSH_OFF_TIMEOUT_MS = 3000;

async function turnOffPushOnThisDevice() {
  const endpoint = await unsubscribeDevice();
  if (endpoint) await pushService.unsubscribe(endpoint);
}

// Sair da conta também desliga os avisos por push deste aparelho: num celular emprestado
// ou compartilhado, os avisos de quem saiu não continuam chegando. Se o desligamento falhar
// ou demorar, sai mesmo assim.
export async function signOut() {
  await Promise.race([
    turnOffPushOnThisDevice().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, PUSH_OFF_TIMEOUT_MS)),
  ]);
  await supabase.auth.signOut();
}
