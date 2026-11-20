/** Sound and system notification when a Pomodoro completes. */

function playPomodoroBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const pulses = [
      { at: 0, freq: 880, dur: 0.18 },
      { at: 0.28, freq: 880, dur: 0.18 },
      { at: 0.56, freq: 1175, dur: 0.35 },
    ];
    for (const p of pulses) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = p.freq;
      const t0 = ctx.currentTime + p.at;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur);
      osc.start(t0);
      osc.stop(t0 + p.dur + 0.02);
    }
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // no audio available
  }
}

/** Asks once for permission to show notifications (on the first Start). */
export function requestNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function notifyPomodoro(minutes = 25) {
  playPomodoroBeep();
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("Pomodoro complete", {
        body: `${Math.round(minutes)} minutes done. Timer stopped.`,
      });
    } catch {
      // notifications not available
    }
  }
}
