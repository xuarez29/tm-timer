// ─────────────────────────────────────────────────────────────────────────────
// TimerScreen.jsx — Full-screen timer display with colour changes
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react';
import { getTimerState, formatTime } from '../utils/timerConfig';
import { useTimer } from '../hooks/useTimer';
import styles from './TimerScreen.module.css';

/* Background and text colour per timer state */
const PALETTE = {
  black:  { bg: '#000000', text: '#ffffff' },
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

export default function TimerScreen({ mode, onBack }) {
  const { elapsed, status, start, pause, resume, reset, stop } = useTimer();
  const wakeLockRef = useRef(null);
  const [hideNumbers, setHideNumbers] = useState(false);

  const timerState = getTimerState(elapsed, mode.thresholds);
  const { bg, text } = PALETTE[timerState];
  const isBlink = timerState === 'blink';

  // ── Wake lock: keep screen on while timer is visible ──────────────────────
  useEffect(() => {
    const acquireWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {
          /* silent — wake lock not granted (low battery, etc.) */
        }
      }
    };

    acquireWakeLock();

    // Re-acquire after the page becomes visible again (e.g. tab switch)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquireWakeLock();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakeLockRef.current?.release();
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

  // ── Stop timer and return to menu ─────────────────────────────────────────
  const handleFinish = () => {
    stop();
    onBack();
  };

  const handleReset = () => {
    setHideNumbers(false);
    reset();
  };

  const isIdle    = status === 'idle';
  const isRunning = status === 'running';
  const isPaused  = status === 'paused';
  const hasStarted = !isIdle;

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
          style={{ color: text, borderColor: `${text}55` }}
          aria-label="Volver al menú"
        >
          ← Menú
        </button>

        <span className={styles.modeName}>{mode.name}</span>

        <button
          className={styles.topBtn}
          onClick={toggleFullscreen}
          style={{ color: text, borderColor: `${text}55` }}
          aria-label="Pantalla completa"
        >
          ⛶
        </button>
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
          className={styles.btn}
          style={{ color: text, borderColor: `${text}44`, background: `${text}10` }}
          onClick={handleFinish}
        >
          ✕ Terminar
        </button>
      </div>
    </div>
  );
}
