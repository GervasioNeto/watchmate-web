// Onde o app está rodando. `isDev` vem do próprio Vite: true no `npm run dev` (a sua máquina),
// false em todo build (inclusive o da Vercel, na develop e na main). Serve para ferramentas que
// só fazem sentido para quem desenvolve, como a prévia do presente.
export const isDev = import.meta.env.DEV;
