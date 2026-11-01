/** Soft glass chime generated with Web Audio (no audio files, works offline). Call only from effects or event handlers. */
let ctx: AudioContext | null = null;
export function playChime() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const start = ctx.currentTime + 0.02;
    [[880, 0], [1318.5, 0.14], [1760, 0.28]].forEach(([freq, delay]) => {
      const osc = ctx!.createOscillator(); const gain = ctx!.createGain();
      osc.type = "sine"; osc.frequency.value = freq!;
      const t0 = start + delay!;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
      osc.connect(gain).connect(ctx!.destination); osc.start(t0); osc.stop(t0 + 1.3);
    });
  } catch { /* audio unavailable */ }
}
