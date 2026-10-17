// A short synthesized tick (from the v2 command menu): moving through menu items, and the
// toolbar arrow gliding from one icon to the next. Browsers keep audio muted until the visitor
// has clicked or pressed a key on the page, so the first few hovers may be silent.
let ctx: AudioContext | null = null;

export function tick() {
  try {
    ctx ??= new AudioContext();
    const ac = ctx;
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.03);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  } catch {}
}
