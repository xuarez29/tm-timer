// ─────────────────────────────────────────────────────────────────────────────
// timerConfig.js — Predefined modes and helper functions for the timer logic
// ─────────────────────────────────────────────────────────────────────────────

/** Predefined speech modes with their color-change thresholds (in seconds) */
export const MODES = {
  icebreaker: {
    id: 'icebreaker',
    name: 'Icebreaker',
    maxSeconds: 360, // 6:00
    thresholds: {
      green:  240, // 4:00 — minimum time reached
      yellow: 300, // 5:00 — approaching limit
      red:    360, // 6:00 — maximum reached
      blink:  390, // 6:30 — overtime
    },
  },

  prepared: {
    id: 'prepared',
    name: 'Discurso Preparado',
    maxSeconds: 420, // 7:00
    thresholds: {
      green:  300, // 5:00
      yellow: 360, // 6:00
      red:    420, // 7:00
      blink:  450, // 7:30
    },
  },

  tableTopics: {
    id: 'tableTopics',
    name: 'Table Topics',
    maxSeconds: 120, // 2:00
    thresholds: {
      green:  60,  // 1:00
      yellow: 90,  // 1:30
      red:    120, // 2:00
      blink:  150, // 2:30
    },
  },
};

/**
 * Build a Variable mode config from a number of minutes.
 * Rules:
 *   green  = max - 2 min  (clamped to 0)
 *   yellow = max - 1 min  (clamped to 0)
 *   red    = max
 *   blink  = max + 30 s
 */
export function getVariableConfig(minutes) {
  const maxSeconds = minutes * 60;
  return {
    id: 'variable',
    name: `Variable (${minutes} min)`,
    maxSeconds,
    thresholds: {
      green:  Math.max(0, maxSeconds - 120),
      yellow: Math.max(0, maxSeconds - 60),
      red:    maxSeconds,
      blink:  maxSeconds + 30,
    },
  };
}

/**
 * Returns the current colour state based on elapsed seconds and thresholds.
 * @returns {'black'|'green'|'yellow'|'red'|'blink'}
 */
export function getTimerState(elapsed, thresholds) {
  if (elapsed >= thresholds.blink)  return 'blink';
  if (elapsed >= thresholds.red)    return 'red';
  if (elapsed >= thresholds.yellow) return 'yellow';
  if (elapsed >= thresholds.green)  return 'green';
  return 'black';
}

/**
 * Formats a raw seconds count to "mm:ss".
 * @param {number} totalSeconds
 * @returns {string} e.g. "04:35"
 */
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
