import { useNavigate } from 'react-router-dom';
import { v } from '@/config/tokens';
import { ROUTES } from '@/config/constants';
import { LxBtn, LxIcon } from './primitives';

/**
 * Shown for an address inside the authenticated area that matches no screen.
 *
 * It renders within the shell rather than handing off to the global 404 so a
 * stale or mistyped link leaves the navigation in place and the user one click
 * from the feed.
 */
export function ScreenNotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 40,
        fontFamily: v.fontBody,
      }}
    >
      <LxIcon name="explore" size={32} color={v.ink3} />
      <div style={{ fontSize: 14, color: v.ink2 }}>this page doesn&apos;t exist</div>
      <LxBtn variant="secondary" size="sm" onClick={() => navigate(ROUTES.FEED)}>
        back to feed
      </LxBtn>
    </div>
  );
}
