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

  // extraState rides alongside the recorded background, so an overlay can be told
  // what to focus once it opens - for example the comment a notification points at.
  return useCallback(
    (to, extraState) =>
      navigate(to, { state: { background: location.pathname, ...(extraState || {}) } }),
    [navigate, location.pathname]
  );
}
