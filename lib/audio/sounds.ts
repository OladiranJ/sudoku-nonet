let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  return ctx;
}

/**
 * Short soft click — sine wave at 800 Hz, 50 ms, low volume.
 */
export function playClickSound(): void {
  const ac = getContext();
  if (!ac) return;

  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = "sine";
  osc.frequency.value = 800;
  gain.gain.value = 0.08;

  osc.connect(gain);
  gain.connect(ac.destination);

  const now = ac.currentTime;
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * Gentle two-note ascending chime for puzzle completion.
 */
export function playChimeSound(): void {
  const ac = getContext();
  if (!ac) return;

  const now = ac.currentTime;

  // First note — C5 (523 Hz)
  const osc1 = ac.createOscillator();
  const gain1 = ac.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 523.25;
  gain1.gain.value = 0.12;
  gain1.gain.setValueAtTime(0.12, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc1.connect(gain1);
  gain1.connect(ac.destination);
  osc1.start(now);
  osc1.stop(now + 0.2);

  // Second note — E5 (659 Hz), slightly delayed
  const osc2 = ac.createOscillator();
  const gain2 = ac.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 659.25;
  gain2.gain.value = 0.001;
  gain2.gain.setValueAtTime(0.001, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.12, now + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc2.connect(gain2);
  gain2.connect(ac.destination);
  osc2.start(now + 0.1);
  osc2.stop(now + 0.35);
}
