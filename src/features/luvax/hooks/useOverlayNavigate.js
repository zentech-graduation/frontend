import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Opens an overlay address while recording the screen it was opened from.
 *
 * Post detail and the story screens render on top of another screen rather than
 * replacing it. The address alone cannot say which screen that is, so the
 * originating path is stored in history state, where it survives back, forward,
 * and a reload. Opening one of these addresses cold carries no such state and
 * the layout falls back to the feed, which is what the previous screen-state
 * implementation did whenever its history stack was empty.
 */
export function useOverlayNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (to) => navigate(to, { state: { background: location.pathname } }),
    [navigate, location.pathname]
  );
}
