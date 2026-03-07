// ─────────────────────────────────────────────────────────────────────────────
// useTimer.js — Reusable hook for count-up timer logic
// Uses Date.now() deltas for drift-free accuracy; updates every 250 ms.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * @typedef {'idle'|'running'|'paused'|'stopped'} TimerStatus
 *
 * @returns {{
 *   elapsed: number,       // seconds elapsed
 *   status: TimerStatus,
 *   start:  () => void,
 *   pause:  () => void,
 *   resume: () => void,
 *   reset:  () => void,
 *   stop:   () => void,
 * }}
 */
export function useTimer() {
  const [elapsed, setElapsed]   = useState(0);          // seconds shown
  const [status,  setStatus]    = useState('idle');

  const intervalRef          = useRef(null);
  const startTimestampRef    = useRef(0);   // wall-clock when interval started
  const elapsedAtResumeRef   = useRef(0);   // snapshot of elapsed when play began

  // Clear the running interval
  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Internal: kick off the interval from the current elapsedAtResumeRef
  const beginCounting = () => {
    startTimestampRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const delta = Math.floor((Date.now() - startTimestampRef.current) / 1000);
      setElapsed(elapsedAtResumeRef.current + delta);
    }, 250);
  };

  const start = useCallback(() => {
    if (status !== 'idle') return;
    elapsedAtResumeRef.current = 0;
    setElapsed(0);
    setStatus('running');
    beginCounting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    clearTimer();
    // Snapshot the current elapsed so resume starts from here
    setElapsed((prev) => {
      elapsedAtResumeRef.current = prev;
      return prev;
    });
    setStatus('paused');
  }, [status]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    setStatus('running');
    beginCounting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const reset = useCallback(() => {
    clearTimer();
    elapsedAtResumeRef.current = 0;
    setElapsed(0);
    setStatus('idle');
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setStatus('stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), []);

  return { elapsed, status, start, pause, resume, reset, stop };
}
