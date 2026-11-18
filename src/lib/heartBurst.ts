import confetti from 'canvas-confetti';
import { HEART_PATH } from '@/lib/gifts';

// A explosão de corações do presente, num <canvas> dentro da própria tela do presente (um
// canvas solto na página ficaria por baixo do <dialog>, que vive na camada de cima). Quem
// pediu menos movimento no sistema não vê a explosão: o presente abre direto.

let heartShape: confetti.Shape | null = null;

// O traçado vira forma uma vez só (calcular a forma é caro).
function heart(): confetti.Shape {
  heartShape ??= confetti.shapeFromPath({ path: HEART_PATH });
  return heartShape;
}

export interface HeartBurst {
  // A explosão a partir de um ponto da tela (0 a 1), mais dois jatos dos cantos de baixo.
  burst: (origin: { x: number; y: number }) => void;
  // Corações caindo devagar do alto por um tempo, depois da explosão.
  rain: (durationMs: number) => void;
  stop: () => void;
}

export function createHeartBurst(canvas: HTMLCanvasElement, colors: readonly string[]): HeartBurst {
  const fire = confetti.create(canvas, { resize: true, disableForReducedMotion: true });
  const sparkle = confetti.shapeFromText({ text: '💖', scalar: 2 });
  const base = { shapes: [heart()], colors: [...colors], disableForReducedMotion: true };
  let raining = 0;
  const timers: number[] = [];

  return {
    burst(origin) {
      void fire({
        ...base,
        origin,
        particleCount: 110,
        spread: 120,
        startVelocity: 52,
        scalar: 1.7,
        ticks: 280,
        gravity: 0.85,
      });
      void fire({
        ...base,
        origin,
        particleCount: 50,
        spread: 200,
        startVelocity: 28,
        scalar: 1.1,
        ticks: 240,
      });
      void fire({
        shapes: [sparkle],
        origin,
        particleCount: 16,
        spread: 110,
        startVelocity: 42,
        scalar: 2.4,
        ticks: 300,
        flat: true,
        disableForReducedMotion: true,
      });
      timers.push(
        window.setTimeout(() => {
          void fire({
            ...base,
            particleCount: 70,
            angle: 62,
            spread: 64,
            startVelocity: 62,
            origin: { x: 0, y: 0.95 },
            scalar: 1.4,
            ticks: 300,
          });
          void fire({
            ...base,
            particleCount: 70,
            angle: 118,
            spread: 64,
            startVelocity: 62,
            origin: { x: 1, y: 0.95 },
            scalar: 1.4,
            ticks: 300,
          });
        }, 260),
      );
    },
    rain(durationMs) {
      const end = Date.now() + durationMs;
      const frame = () => {
        void fire({
          ...base,
          particleCount: 1,
          startVelocity: 0,
          gravity: 0.45,
          ticks: 420,
          scalar: 0.9 + Math.random() * 0.9,
          drift: Math.random() - 0.5,
          origin: { x: Math.random(), y: -0.05 },
        });
        if (Date.now() < end) raining = requestAnimationFrame(frame);
      };
      raining = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raining);
      for (const timer of timers) clearTimeout(timer);
      fire.reset();
    },
  };
}
