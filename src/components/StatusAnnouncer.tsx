interface StatusAnnouncerProps {
  message: string;
}

/** SPEC §14 — the single polite live region for discrete events. */
export function StatusAnnouncer({ message }: StatusAnnouncerProps) {
  return (
    <p className="sr-only" role="status">
      {message}
    </p>
  );
}
