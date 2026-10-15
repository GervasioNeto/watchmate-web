// Rolagem suave, a não ser que a pessoa tenha pedido menos movimento no sistema.
export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
