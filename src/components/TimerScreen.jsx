// ─────────────────────────────────────────────────────────────────────────────
// TimerScreen.jsx — Full-screen timer display with colour changes
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react';
import { getTimerState, formatTime } from '../utils/timerConfig';
import { useTimer } from '../hooks/useTimer';
import styles from './TimerScreen.module.css';

/* Background and text colour per timer state.
   Idle sits on the app's navy ground; the semaphore states stay pure so the
   colour reads unambiguously from the back of the room. */
const PALETTE = {
  black:  { bg: '#08192A', text: '#F4EDE2' },
  green:  { bg: '#00cc44', text: '#000000' },
  yellow: { bg: '#ffcc00', text: '#000000' },
  red:    { bg: '#dd1111', text: '#ffffff' },
  blink:  { bg: '#dd1111', text: '#ffffff' }, // CSS animation handles the flash
};

const STATE_LABELS = {
  green:  'Tiempo mínimo alcanzado',
  yellow: 'Próximo al límite',
  red:    'Tiempo máximo alcanzado',
  blink:  '¡Tiempo excedido!',
};

/* The Fullscreen API is unavailable on iPhone Safari, so the control is only
   offered on pointer devices where it actually does something. */
const isDesktop = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11l9-7 9 7"/>
    <path d="M5 9.5V20h14V9.5"/>
    <path d="M9.5 20v-5h5v5"/>
  </svg>
);

const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>
  </svg>
);

export default function TimerScreen({ mode, onBack }) {
  const { elapsed, status, start, pause, resume, reset } = useTimer();
  const wakeLockRef = useRef(null);
  const [hideNumbers, setHideNumbers] = useState(false);
  const [showFullscreen] = useState(isDesktop);

  const timerState = getTimerState(elapsed, mode.thresholds);
  const { bg, text } = PALETTE[timerState];
  const isBlink = timerState === 'blink';

  // ── Wake lock: keep screen on while timer is visible ──────────────────────
  // Held for the whole screen, not just while running: the timekeeper sets the
  // phone down before the speaker starts, and it must not sleep in between.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    let cancelled = false;

    const acquireWakeLock = async () => {
      // Never stack locks — a live one already keeps the screen awake, and
      // overwriting the ref would strand the previous one unreleased.
      if (wakeLockRef.current) return;

      try {
        const lock = await navigator.wakeLock.request('screen');

        // Unmounted while the request was in flight
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }

        wakeLockRef.current = lock;

        // The browser drops the lock whenever the page hides; clear our handle
        // so the next acquire isn't short-circuited by a dead one.
        lock.addEventListener('release', () => {
          if (wakeLockRef.current === lock) wakeLockRef.current = null;
        });
      } catch {
        /* silent — wake lock not granted (low battery, etc.) */
      }
    };

    acquireWakeLock();

    // Re-acquire after the page becomes visible again (e.g. tab switch)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquireWakeLock();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  // ── Fullscreen toggle ──────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const handleReset = () => {
    setHideNumbers(false);
    reset();
  };

  const isIdle    = status === 'idle';
  const isRunning = status === 'running';
  const isPaused  = status === 'paused';
  const hasStarted = !isIdle;

  const edge = `${text}55`;

  return (
    <div
      className={`${styles.screen} ${isBlink ? styles.blink : ''}`}
      style={isBlink ? { color: text } : { backgroundColor: bg, color: text }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <button
          className={styles.topBtn}
          onClick={onBack}
          style={{ color: text, borderColor: edge }}
          aria-label="Volver al menú"
        >
          <HomeIcon />
        </button>

        <span className={styles.modeName}>{mode.name}</span>

        {showFullscreen ? (
          <button
            className={styles.topBtn}
            onClick={toggleFullscreen}
            style={{ color: text, borderColor: edge }}
            aria-label="Pantalla completa"
            title="Pantalla completa"
          >
            <FullscreenIcon />
          </button>
        ) : (
          /* Keeps the mode name optically centred */
          <span className={styles.topSpacer} aria-hidden="true" />
        )}
      </div>

      {/* ── Timer display ────────────────────────────────────────────────── */}
      <div className={styles.display}>
        <span
          className={`${styles.time} ${hideNumbers ? styles.hidden : ''}`}
          aria-live="off"
        >
          {formatTime(elapsed)}
        </span>

        {/* State label — only show once timer has a meaningful state */}
        <span
          className={styles.stateLabel}
          style={{ opacity: timerState !== 'black' && !hideNumbers ? 1 : 0 }}
        >
          {STATE_LABELS[timerState] ?? ''}
        </span>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className={styles.controls}>
        {/* Primary action: Start / Pause / Resume */}
        {isIdle && (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ color: text, borderColor: `${text}44`, background: `${text}18` }}
            onClick={start}
          >
            ▶ Iniciar
          </button>
        )}

        {isRunning && (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ color: text, borderColor: `${text}44`, background: `${text}18` }}
            onClick={pause}
          >
            ⏸ Pausar
          </button>
        )}

        {isPaused && (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ color: text, borderColor: `${text}44`, background: `${text}18` }}
            onClick={resume}
          >
            ▶ Reanudar
          </button>
        )}

        {/* Secondary actions: only visible once started */}
        {hasStarted && (
          <>
            <button
              className={styles.btn}
              style={{ color: text, borderColor: `${text}44`, background: `${text}10` }}
              onClick={() => setHideNumbers((h) => !h)}
            >
              {hideNumbers ? '◉ Mostrar' : '○ Ocultar'}
            </button>

            <button
              className={styles.btn}
              style={{ color: text, borderColor: `${text}44`, background: `${text}10` }}
              onClick={handleReset}
            >
              ↺ Reiniciar
            </button>
          </>
        )}

        <button
          className={`${styles.btn} ${styles.btnWide}`}
          style={{ color: text, borderColor: `${text}44`, background: `${text}10` }}
          onClick={onBack}
        >
          ✕ Terminar
        </button>
      </div>
    </div>
  );
}
