import { useState, useEffect } from 'react';

// ── Viewport hook ──────────────────────────────────────────────────────────
export function useViewport() {
  const get = () => {
    const w = window.innerWidth;
    if (w >= 1200) return 'desktop';
    if (w >= 768)  return 'tablet';
    return 'mobile';
  };
  const [vp, setVp] = useState(get);
  useEffect(() => {
    const handler = () => setVp(get());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return vp;
}
