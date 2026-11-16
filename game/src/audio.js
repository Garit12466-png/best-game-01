// MONSTERWEAVE — Procedural Web Audio API Sound Synthesizer & Synthwave Chiptune Engine
// Zero external sound assets needed, 100% self-contained and offline compliant.

let ctx = null;
let isMuted = false;
let bgmInterval = null;
let bgmStep = 0;

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function toggleAudioMute() {
  isMuted = !isMuted;
  if (isMuted && bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  return isMuted;
}

export function getAudioMuted() {
  return isMuted;
}

/** Crisp crystalline click when dropping a block onto grid */
export function playPlaceSound() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/** Harmonic chord arpeggio when a line/column blasts */
export function playBlastSound(combo = 1) {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const baseFreq = 260 + (combo - 1) * 75;
  const chordNotes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
  const now = c.currentTime;

  chordNotes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.05);

    gain.gain.setValueAtTime(0.18, now + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now + i * 0.05);
    osc.stop(now + i * 0.05 + 0.25);
  });
}

/** High-energy beam salvo launching across into monsters */
export function playSalvoSound() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

/** Deep explosion sound with lowpass filtered noise */
export function playExplosionSound() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

/** Impact hit sound */
export function playHitSound() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/** Sanctum Gate damaged alarm */
export function playDamageSound() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.linearRampToValueAtTime(90, now + 0.25);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

/** Start energetic procedural synth background loop */
export function startBgmSequence() {
  if (bgmInterval || isMuted) return;
  const c = getContext();
  if (!c) return;

  const bassScale = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 123.47];
  bgmInterval = setInterval(() => {
    if (isMuted) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    const freq = bassScale[bgmStep % bassScale.length];
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    osc.stop(now + 0.18);
    bgmStep = (bgmStep + 1) % bassScale.length;
  }, 220);
}
