interface StatusAnnouncerProps {
  message: string;
  /** Bumped on every announcement so a repeated message still mutates the DOM. */
  nonce: number;
}

/** SPEC §14 — the single polite live region for discrete events. */
export function StatusAnnouncer({ message, nonce }: StatusAnnouncerProps) {
  return (
    <p className="sr-only" role="status">
      {/* Re-keying replaces the text node, which is what screen readers watch:
          two identical messages in a row (e.g. `Rate updated`) both announce. */}
      <span key={nonce}>{message}</span>
    </p>
  );
}
