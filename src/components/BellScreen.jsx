// ─────────────────────────────────────────────────────────────────────────────
// BellScreen.jsx — Full-screen desk bell; tap the big button to "ding"
// Used in Toastmasters to mark filler words ("muletillas") — Ah-Counter.
// Sound is synthesised on the fly with the Web Audio API (works fully offline).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import styles from './BellScreen.module.css';

const LS_KEY = 'tm-cronometro-v1';

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

// ── Sound-selector icons ─────────────────────────────────────────────────────

const SoftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a6 6 0 0 0-6 6c0 4-1.5 6-3 7h18c-1.5-1-3-3-3-7a6 6 0 0 0-6-6z"/>
    <path d="M10.5 20a2 2 0 0 0 3 0"/>
  </svg>
);

const ClassicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 17h16M3 20h18"/>
    <path d="M5 17a7 7 0 0 1 14 0"/>
    <line x1="12" y1="6" x2="12" y2="10"/>
    <circle cx="12" cy="4.5" r="1.4"/>
  </svg>
);

const ChimeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 4h8M12 4v2M6 20a6 6 0 0 1 12 0z"/>
    <path d="M6 20c0-5 2.5-8 6-8s6 3 6 8"/>
    <circle cx="12" cy="9.5" r=".6" fill="currentColor"/>
  </svg>
);

const SilenceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    <line x1="3" y1="3" x2="21" y2="21"/>
  </svg>
);

const SOUNDS = [
  { id: 'single',  label: 'Suave',     Icon: SoftIcon,    play: playSingleTone },
  { id: 'classic', label: 'Clásica',   Icon: ClassicIcon, play: playClassic },
  { id: 'chime',   label: 'Brillante', Icon: ChimeIcon,   play: playChime },
  // Counts muletillas without making a sound — useful mid-speech
  { id: 'silence', label: 'Silencio',  Icon: SilenceIcon, play: null },
];

const DEFAULT_SOUND = 'classic';

/* Read the persisted sound once, before first paint, so the selector doesn't
   flash the default. Anything unrecognised falls back to the default. */
function loadSound() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && SOUNDS.some((s) => s.id === saved.sound)) return saved.sound;
  } catch {
    /* unavailable or malformed (private mode, cleared storage) — use default */
  }
  return DEFAULT_SOUND;
}

/* Build the AudioContext outside the component: on iOS, Web Audio defaults to
   the "ambient" session, so the phone's physical silent switch mutes it (it
   only escapes via Bluetooth/AirPlay). Declaring the session as "playback"
   makes the bell behave like media playback — it rings through the built-in
   speaker even on silent mode. */
function createAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();

  if ('audioSession' in navigator) {
    try {
      navigator.audioSession.type = 'playback';
    } catch {
      /* not supported on this browser — falls back to default routing */
    }
  }

  return ctx;
}

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11l9-7 9 7"/>
    <path d="M5 9.5V20h14V9.5"/>
    <path d="M9.5 20v-5h5v5"/>
  </svg>
);

export default function BellScreen({ onBack }) {
  const audioCtxRef = useRef(null);
  const [count, setCount] = useState(0);
  const [soundId, setSoundId] = useState(loadSound);

  // Lazily create a single AudioContext, reused across taps
  const getCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioContext();
    return audioCtxRef.current;
  };

  const playSound = async (id) => {
    const sound = SOUNDS.find((s) => s.id === id);
    if (!sound?.play) return; // silence

    try {
      const ctx = getCtx();

      // iOS suspends the context whenever the app goes to the background. A
      // suspended context's clock is frozen, so scheduling against
      // ctx.currentTime would place the ring in the past and drop it — resume
      // has to finish first.
      if (ctx.state === 'suspended') await ctx.resume();

      // Closed by the cleanup while we were awaiting the resume
      if (ctx.state === 'closed') return;

      sound.play(ctx);
    } catch {
      /* audio unavailable — the count still goes up, which is what matters */
    }
  };

  const handleRing = () => {
    // Deliberately not awaited: the counter must react to the tap instantly,
    // even if the audio context takes a moment to wake up.
    playSound(soundId);
    setCount((c) => c + 1);
  };

  // Selecting a sound previews it, so you can compare without counting
  const handleSelectSound = (id) => {
    setSoundId(id);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ sound: id }));
    } catch {
      /* storage unavailable — the choice just won't survive a reload */
    }
    playSound(id);
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
          <HomeIcon />
        </button>
        <span className={styles.heading}>Campanilla</span>
        <span className={styles.spacer} aria-hidden="true" />
      </div>

      {/* ── Big bell button ── */}
      <main className={styles.main}>
        {/* ── Sound selector ── */}
        <div className={styles.soundSelector} role="radiogroup" aria-label="Sonido de la campanilla">
          {SOUNDS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`${styles.soundOption} ${soundId === id ? styles.soundOptionActive : ''}`}
              onClick={() => handleSelectSound(id)}
              role="radio"
              aria-checked={soundId === id}
              aria-label={label}
              title={label}
            >
              <Icon />
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

        {count > 0 ? (
          <p className={styles.counter}>
            {count} {count === 1 ? 'muletilla' : 'muletillas'}
          </p>
        ) : (
          <p className={styles.hint}>Presiona para marcar una muletilla</p>
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
