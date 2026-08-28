import { useEffect, useState } from 'react';

/** Feeds the polling pause (SPEC §8.1) and resumes with an immediate fetch. */
export function usePageHidden(): boolean {
  const [isHidden, setIsHidden] = useState(() => document.hidden);

  useEffect(() => {
    const handleChange = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', handleChange);
    return () => document.removeEventListener('visibilitychange', handleChange);
  }, []);

  return isHidden;
}
