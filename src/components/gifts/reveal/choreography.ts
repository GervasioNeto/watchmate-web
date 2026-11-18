// O ritmo da abertura, num lugar só: o que sai da caixa (GiftContents) e a caixa vazia que
// vai embora depois (GiftReveal) precisam combinar.

// Cada coisa sai da caixa este tanto depois da anterior (as animações no index.css usam
// `--reveal-order` vezes isto).
export const EMERGE_STAGGER_MS = 150;

// As ordens de saída: o título (0) e a carta (1), o título dos vales (2) e os vales (3, 4, 5).
export const ORDER_HEADLINE = 0;
export const ORDER_LETTER = 1;
export const ORDER_VOUCHERS_TITLE = 2;
export const ORDER_FIRST_VOUCHER = 3;

// A ordem da última coisa que sai de dentro da caixa.
export function lastEmergeOrder(voucherCount: number): number {
  return voucherCount > 0 ? ORDER_FIRST_VOUCHER + voucherCount - 1 : ORDER_LETTER;
}

// A caixa vazia afunda assim que a última coisa sai dela (sem ficar por trás do que pousou).
export function spentBoxDelayMs(voucherCount: number): number {
  return lastEmergeOrder(voucherCount) * EMERGE_STAGGER_MS + 120;
}
