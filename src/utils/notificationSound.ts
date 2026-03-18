let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;

  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;

  if (!audioContext) {
    audioContext = new Ctx();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
};

export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    const toneA = ctx.createOscillator();
    toneA.type = "triangle";
    toneA.frequency.setValueAtTime(740, now);
    toneA.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    const toneB = ctx.createOscillator();
    toneB.type = "sine";
    toneB.frequency.setValueAtTime(1100, now + 0.12);
    toneB.frequency.exponentialRampToValueAtTime(980, now + 0.32);

    toneA.connect(masterGain);
    toneB.connect(masterGain);

    toneA.start(now);
    toneA.stop(now + 0.16);

    toneB.start(now + 0.1);
    toneB.stop(now + 0.38);
  } catch {
    // Silent fail if audio is unavailable
  }
};
