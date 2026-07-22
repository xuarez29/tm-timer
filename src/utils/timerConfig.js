// ─────────────────────────────────────────────────────────────────────────────
// timerConfig.js — Predefined modes and helper functions for the timer logic
// ─────────────────────────────────────────────────────────────────────────────

/** Predefined speech modes with their color-change thresholds (in seconds) */
export const MODES = {
  icebreaker: {
    id: 'icebreaker',
    name: 'Rompehielos',
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
    name: 'Tópicos de mesa',
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
 * Durations too short for the standard ramp.
 *
 * The -2 min / -1 min offsets collapse onto zero below three minutes, which
 * used to open a 1-minute slot on yellow and a 2-minute one on green. These
 * two carry explicit thresholds instead.
 */
const SHORT_VARIABLE_THRESHOLDS = {
  // A single minute has no room for three stages: it runs neutral, turns
  // yellow at the halfway mark and red on time. Green never fires because it
  // coincides with yellow, which getTimerState checks first.
  60:  { green: 30, yellow: 30, red: 60,  blink: 90 },
  // Two minutes mirrors the Table Topics preset exactly.
  120: { green: 60, yellow: 90, red: 120, blink: 150 },
};

/**
 * Build a Variable mode config from a number of minutes.
 * From 3 minutes up:
 *   green  = max - 2 min
 *   yellow = max - 1 min
 *   red    = max
 *   blink  = max + 30 s
 */
export function getVariableConfig(minutes) {
  const maxSeconds = minutes * 60;
  return {
    id: 'variable',
    name: `Variable (${minutes} min)`,
    maxSeconds,
    thresholds: SHORT_VARIABLE_THRESHOLDS[maxSeconds] ?? {
      green:  maxSeconds - 120,
      yellow: maxSeconds - 60,
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
