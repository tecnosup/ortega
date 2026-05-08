"use client";

// Todos os sons via Web Audio API — sem arquivos externos

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

// Novo agendamento: dois sinos ascendentes, tom dourado
export function playNovoAgendamento() {
  const ctx = getCtx();
  if (!ctx) return;

  const notes = [880, 1109]; // A5 → C#6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = freq;

    const start = ctx.currentTime + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

    osc.start(start);
    osc.stop(start + 0.5);
  });
}

// Atenção (+2h sem confirmar): pulso suave repetido
export function playAtencao() {
  const ctx = getCtx();
  if (!ctx) return;

  [0, 0.3].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.value = 660;

    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

    osc.start(start);
    osc.stop(start + 0.25);
  });
}

// Crítico (horário passou): três pulsos descendentes urgentes
export function playCritico() {
  const ctx = getCtx();
  if (!ctx) return;

  const notes = [880, 740, 622]; // descendo
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.value = freq;

    const start = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

    osc.start(start);
    osc.stop(start + 0.2);
  });
}
