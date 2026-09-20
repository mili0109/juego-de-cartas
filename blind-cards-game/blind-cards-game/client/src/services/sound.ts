/**
 * Reproduce el efecto de sonido al perder una vida.
 *
 * Por defecto busca /sounds/life-lost.mp3 dentro de la carpeta public/ del cliente.
 * Ese archivo NO viene incluido: reemplazalo por el sonido que quieras usar
 * (tiene que ser un audio del que tengas los derechos — no se puede distribuir
 * música con copyright, como bandas sonoras de anime, dentro del proyecto).
 *
 * Si el archivo no existe todavía, se reproduce un "sting" sintetizado con la
 * Web Audio API como reemplazo temporal, para que la función funcione de una
 * sin necesidad de subir nada primero.
 */

let audioCtx: AudioContext | null = null;

export function playLifeLostSound() {
  const audio = new Audio('/sounds/life-lost.mp3');
  audio.volume = 0.6;
  audio.play().catch(() => {
    playFallbackSting();
  });
}

function playFallbackSting() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    const ctx = audioCtx;
    const now = ctx.currentTime;

    [220, 174, 130].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      gain.gain.setValueAtTime(0.15, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });
  } catch {
    // Si el navegador no soporta Web Audio, simplemente no suena nada.
  }
}
