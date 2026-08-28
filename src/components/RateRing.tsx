import type { CSSProperties } from 'react';
import type { RingProgress } from '../types';
import styles from './RateRing.module.css';

const SIZE = 16;
const STROKE = 2;
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** The in-flight sweep covers a quarter of the ring, as the old spinner did. */
const SWEEP_LENGTH = CIRCUMFERENCE / 4;

interface RateRingProps {
  progress: RingProgress;
}

/** Starts the stroke at 12 o'clock and runs it clockwise. */
const ARC_GEOMETRY = {
  cx: CENTER,
  cy: CENTER,
  r: RADIUS,
  strokeWidth: STROKE,
  transform: `rotate(-90 ${CENTER} ${CENTER})`,
};

function ProgressArc({ progress }: RateRingProps) {
  const { phase, elapsedMs, durationMs } = progress;

  if (phase === 'idle') return null;

  if (phase === 'indeterminate') {
    return (
      <circle
        {...ARC_GEOMETRY}
        className={styles.arc}
        strokeDasharray={`${SWEEP_LENGTH} ${CIRCUMFERENCE}`}
      />
    );
  }

  if (phase === 'frozen') {
    const held = Math.min(1, Math.max(0, elapsedMs / durationMs));
    return (
      <circle
        {...ARC_GEOMETRY}
        className={styles.arc}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - held)}
      />
    );
  }

  // One CSS animation for the whole window: its duration is the poll interval
  // and its negative delay is the part of the window that has already passed.
  const fillStyle = {
    '--ring-length': CIRCUMFERENCE,
    '--ring-duration': `${durationMs}ms`,
    '--ring-delay': `-${elapsedMs}ms`,
  } as CSSProperties;

  return (
    <circle
      {...ARC_GEOMETRY}
      className={`${styles.arc} ${styles.fill}`}
      strokeDasharray={CIRCUMFERENCE}
      style={fillStyle}
    />
  );
}

/**
 * SPEC §8.1 — the 16px ring next to the rate text. It fills as the time to the
 * next price request runs out, spins while a request is in flight (no time left
 * to show) and holds still while polling is paused.
 *
 * Decorative on purpose: the rate text beside it carries the meaning, and the
 * progress repeats every 10 s, which is nothing to announce.
 */
export function RateRing({ progress }: RateRingProps) {
  const classes = [styles.ring, progress.phase === 'indeterminate' ? styles.spinning : '']
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      className={classes}
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      focusable="false"
      aria-hidden="true"
    >
      <circle {...ARC_GEOMETRY} className={styles.track} />
      {/* A new poll window restarts the fill from scratch, whatever React
          decides to batch on the way there. */}
      <ProgressArc key={`${progress.phase}-${progress.startedAt}`} progress={progress} />
    </svg>
  );
}
