// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen.jsx — Mode selection screen
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { MODES, getVariableConfig } from '../utils/timerConfig';
import styles from './HomeScreen.module.css';

// ── Inline SVG icons (stroke-based, Heroicons style) ─────────────────────────

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8"  y1="22" x2="16" y2="22"/>
  </svg>
);

const PresentationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="20" height="13" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
    <path d="M7 8h10M7 11.5h6"/>
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5"  r="3"/>
    <circle cx="6"  cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
  </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────────

const PRESET_CARDS = [
  { mode: MODES.icebreaker,  Icon: MicIcon,          label: '4 – 6 min' },
  { mode: MODES.prepared,    Icon: PresentationIcon, label: '5 – 7 min' },
  { mode: MODES.tableTopics, Icon: ChatIcon,         label: '1 – 2 min' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen({ onSelectMode }) {
  const [variableMinutes,   setVariableMinutes]   = useState(5);
  const [showVariablePanel, setShowVariablePanel] = useState(false);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const handleVariableStart = () => onSelectMode(getVariableConfig(variableMinutes));

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Toastmasters Timer',
        text: 'Temporizador para sesiones de Toastmasters',
        url: window.location.href,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <img src="/logo.png" alt="Toastmasters International" className={styles.logo} />
        <h1 className={styles.title}>Toastmasters Timer</h1>
        <p className={styles.subtitle}>Selecciona un formato</p>
      </header>

      {/* ── Mode cards ── */}
      <main className={styles.cardList}>
        {PRESET_CARDS.map(({ mode, Icon, label }) => (
          <button
            key={mode.id}
            className={styles.card}
            onClick={() => onSelectMode(mode)}
          >
            <span className={styles.iconBox}>
              <Icon />
            </span>
            <span className={styles.cardBody}>
              <span className={styles.cardName}>{mode.name}</span>
              <span className={styles.cardDuration}>{label}</span>
            </span>
            <span className={styles.chevron}>
              <ChevronRight />
            </span>
          </button>
        ))}

        {/* ── Variable time card ── */}
        {!showVariablePanel ? (
          <button
            className={styles.card}
            onClick={() => setShowVariablePanel(true)}
          >
            <span className={styles.iconBox}>
              <ClockIcon />
            </span>
            <span className={styles.cardBody}>
              <span className={styles.cardName}>Tiempo Variable</span>
              <span className={styles.cardDuration}>Personalizado</span>
            </span>
            <span className={styles.chevron}>
              <ChevronRight />
            </span>
          </button>
        ) : (
          <div className={`${styles.card} ${styles.variablePanel}`}>
            <div className={styles.variablePanelHeader}>
              <span className={styles.iconBox}>
                <ClockIcon />
              </span>
              <span className={styles.cardName}>¿Cuántos minutos?</span>
            </div>

            <div className={styles.stepper}>
              <button
                className={styles.stepBtn}
                onClick={() => setVariableMinutes((m) => clamp(m - 1, 1, 60))}
                aria-label="Menos un minuto"
              >−</button>
              <span className={styles.stepValue}>{variableMinutes} min</span>
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
                Iniciar
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <button className={styles.shareBtn} onClick={handleShare}>
          <ShareIcon />
          Compartir app
        </button>
      </footer>

    </div>
  );
}
