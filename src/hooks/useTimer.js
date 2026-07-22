// ─────────────────────────────────────────────────────────────────────────────
// useTimer.js — Reusable hook for count-up timer logic
// Uses Date.now() deltas for drift-free accuracy; updates every 250 ms.
// Time is tracked in milliseconds internally and only floored for display, so
// pausing never discards the fraction of a second in progress.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * @typedef {'idle'|'running'|'paused'} TimerStatus
 *
 * @returns {{
 *   elapsed: number,       // whole seconds elapsed, for display
 *   status: TimerStatus,
 *   start:  () => void,
 *   pause:  () => void,
 *   resume: () => void,
 *   reset:  () => void,
 * }}
 */
export function useTimer() {
  const [elapsed, setElapsed]   = useState(0);          // seconds shown
  const [status,  setStatus]    = useState('idle');

  const intervalRef       = useRef(null);
  const segmentStartRef   = useRef(0);   // wall-clock when the current run began
  const bankedMsRef       = useRef(0);   // ms accumulated by previous segments

  // These only touch refs and the stable setElapsed, so they never need to be
  // rebuilt — which keeps the callbacks below free of churning dependencies.

  // Clear the running interval
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Exact ms elapsed right now, including the segment in progress (if any)
  const currentMs = useCallback(
    () =>
      bankedMsRef.current +
      (intervalRef.current ? Date.now() - segmentStartRef.current : 0),
    []
  );

  // Internal: kick off the interval from whatever is already banked
  const beginCounting = useCallback(() => {
    segmentStartRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor(currentMs() / 1000));
    }, 250);
  }, [currentMs]);

  const start = useCallback(() => {
    if (status !== 'idle') return;
    bankedMsRef.current = 0;
    setElapsed(0);
    setStatus('running');
    beginCounting();
  }, [status, beginCounting]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    // Bank the exact millisecond count *before* stopping the interval, so
    // resuming picks up mid-second instead of rewinding to the last whole one.
    bankedMsRef.current = currentMs();
    clearTimer();
    setElapsed(Math.floor(bankedMsRef.current / 1000));
    setStatus('paused');
  }, [status, currentMs, clearTimer]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    setStatus('running');
    beginCounting();
  }, [status, beginCounting]);

  const reset = useCallback(() => {
    clearTimer();
    bankedMsRef.current = 0;
    setElapsed(0);
    setStatus('idle');
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  return { elapsed, status, start, pause, resume, reset };
}
