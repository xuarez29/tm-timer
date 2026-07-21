// ─────────────────────────────────────────────────────────────────────────────
// BellScreen.jsx — Full-screen desk bell; tap the big button to "ding"
// Used in Toastmasters to mark filler words ("muletillas") — Ah-Counter.
// Sound is synthesised on the fly with the Web Audio API (works fully offline).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import styles from './BellScreen.module.css';

// ── Synthesised bell sounds ──────────────────────────────────────────────────
// A metallic bell is inharmonic: we stack a few detuned partials with a sharp
// attack and a long exponential decay to imitate the bright ring.
function ringPartials(ctx, startTime, partials, duration, peakGain = 1.8) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, startTime);
  master.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.004);
  master.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  // Soft limiter so the higher volume doesn't harshly clip
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-6, startTime);
  limiter.ratio.setValueAtTime(12, startTime);
  master.connect(limiter).connect(ctx.destination);

  partials.forEach(({ freq, gain }) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, startTime);
    // Higher partials decay faster — gives the "ting" then mellow ring
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration - freq / 8000);

    osc.connect(g).connect(master);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  });
}

// Classic hotel front-desk bell — bright, short ring
function playClassic(ctx) {
  ringPartials(ctx, ctx.currentTime, [
    { freq: 2000, gain: 1.0 },
    { freq: 2760, gain: 0.6 },
    { freq: 4200, gain: 0.35 },
    { freq: 5400, gain: 0.18 },
  ], 1.8);
}

// Single pure tone — one sustained note, like a small singing bowl "ting"
function playSingleTone(ctx) {
  ringPartials(ctx, ctx.currentTime, [
    { freq: 880, gain: 1.0 }, // A5, almost no overtones for a clean single note
  ], 2.2, 1.6);
}

// Bright, shimmering triangle-style chime — longer sustain
function playChime(ctx) {
  ringPartials(ctx, ctx.currentTime, [
    { freq: 3520, gain: 0.9 },
    { freq: 4460, gain: 0.7 },
    { freq: 5920, gain: 0.5 },
    { freq: 7040, gain: 0.3 },
    { freq: 8900, gain: 0.15 },
  ], 2.6, 1.5);
}

const SOUNDS = [
  { id: 'classic', label: 'Clásica', play: playClassic },
  { id: 'single', label: 'Suave', play: playSingleTone },
  { id: 'chime', label: 'Brillante', play: playChime },
];

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function BellScreen({ onBack }) {
  const audioCtxRef = useRef(null);
  const [count, setCount] = useState(0);
  const [soundId, setSoundId] = useState(SOUNDS[0].id);

  // Lazily create a single AudioContext, reused across taps
  const getCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();

      // iOS: by default Web Audio counts as "ambient" audio, so the phone's
      // physical silent switch mutes it (it only escapes via Bluetooth/AirPlay).
      // Declaring the session as "playback" makes the bell behave like media
      // playback — it rings through the built-in speaker even on silent mode.
      if ('audioSession' in navigator) {
        try {
          navigator.audioSession.type = 'playback';
        } catch {
          /* not supported on this browser — falls back to default routing */
        }
      }
    }
    return audioCtxRef.current;
  };

  const handleRing = () => {
    const ctx = getCtx();
    // iOS/Safari suspends the context until a user gesture resumes it
    if (ctx.state === 'suspended') ctx.resume();
    const sound = SOUNDS.find((s) => s.id === soundId) ?? SOUNDS[0];
    sound.play(ctx);
    setCount((c) => c + 1);
  };

  // Release the audio context when leaving the screen
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  return (
    <div className={styles.screen}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button className={styles.topBtn} onClick={onBack} aria-label="Volver al menú">
          ← Menú
        </button>
        <span className={styles.heading}>Campanilla</span>
        <span className={styles.spacer} aria-hidden="true" />
      </div>

      {/* ── Big bell button ── */}
      <main className={styles.main}>
        {/* ── Sound selector ── */}
        <div className={styles.soundSelector} role="radiogroup" aria-label="Sonido de la campanilla">
          {SOUNDS.map(({ id, label }) => (
            <button
              key={id}
              className={`${styles.soundOption} ${soundId === id ? styles.soundOptionActive : ''}`}
              onClick={() => setSoundId(id)}
              role="radio"
              aria-checked={soundId === id}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          className={styles.bellButton}
          onClick={handleRing}
          aria-label="Tocar campanilla"
        >
          <BellIcon />
        </button>
        <p className={styles.hint}>Presiona para marcar una muletilla</p>
        {count > 0 && (
          <p className={styles.counter}>
            {count} {count === 1 ? 'muletilla' : 'muletillas'}
          </p>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <button
          className={styles.resetBtn}
          onClick={() => setCount(0)}
          disabled={count === 0}
        >
          ↺ Reiniciar
        </button>
      </footer>
    </div>
  );
}
