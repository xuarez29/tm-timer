// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen.jsx — Mode selection screen
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { MODES, getVariableConfig } from '../utils/timerConfig';
import styles from './HomeScreen.module.css';

const PRESET_CARDS = [
  { mode: MODES.icebreaker,   icon: '🧊', subtitle: '4 – 6 min' },
  { mode: MODES.prepared,     icon: '🎤', subtitle: '5 – 7 min' },
  { mode: MODES.tableTopics,  icon: '💬', subtitle: '1 – 2 min' },
];

export default function HomeScreen({ onSelectMode }) {
  const [variableMinutes,    setVariableMinutes]    = useState(5);
  const [showVariablePanel,  setShowVariablePanel]  = useState(false);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const handleVariableStart = () => {
    onSelectMode(getVariableConfig(variableMinutes));
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Toastmasters Timer',
        text: 'Temporizador para sesiones de Toastmasters',
        url: window.location.href,
      }).catch(() => {}); // user cancelled — ignore
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  return (
    <div className={styles.screen}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <img
          src="/logo.png"
          alt="Toastmasters International"
          className={styles.logo}
        />
        <p className={styles.tagline}>Timer</p>
      </header>

      {/* ── Mode cards ── */}
      <main className={styles.cardList}>
        {PRESET_CARDS.map(({ mode, icon, subtitle }) => (
          <button
            key={mode.id}
            className={styles.card}
            onClick={() => onSelectMode(mode)}
          >
            <span className={styles.cardIcon}>{icon}</span>
            <span className={styles.cardName}>{mode.name}</span>
            <span className={styles.cardSub}>{subtitle}</span>
          </button>
        ))}

        {/* ── Variable time card ── */}
        {!showVariablePanel ? (
          <button
            className={`${styles.card} ${styles.cardAlt}`}
            onClick={() => setShowVariablePanel(true)}
          >
            <span className={styles.cardIcon}>⏱</span>
            <span className={styles.cardName}>Tiempo Variable</span>
            <span className={styles.cardSub}>Personalizado</span>
          </button>
        ) : (
          <div className={`${styles.card} ${styles.cardAlt} ${styles.variablePanel}`}>
            <span className={styles.cardIcon}>⏱</span>
            <span className={styles.cardName}>¿Cuántos minutos?</span>

            {/* ── Minute stepper ── */}
            <div className={styles.stepper}>
              <button
                className={styles.stepBtn}
                onClick={() => setVariableMinutes((m) => clamp(m - 1, 1, 60))}
                aria-label="Menos un minuto"
              >−</button>
              <span className={styles.stepValue}>{variableMinutes}</span>
              <button
                className={styles.stepBtn}
                onClick={() => setVariableMinutes((m) => clamp(m + 1, 1, 60))}
                aria-label="Más un minuto"
              >+</button>
            </div>

            <div className={styles.variableActions}>
              <button className={styles.cancelBtn} onClick={() => setShowVariablePanel(false)}>
                Cancelar
              </button>
              <button className={styles.goBtn} onClick={handleVariableStart}>
                Iniciar →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <button className={styles.shareBtn} onClick={handleShare}>
          Compartir app
        </button>
      </footer>
    </div>
  );
}
