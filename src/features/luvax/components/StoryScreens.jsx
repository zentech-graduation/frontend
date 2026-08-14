import { useNavigate } from 'react-router-dom';
import { v } from '@/config/tokens';
import { LxIcon, LxBtn } from './primitives';
import { ROUTES } from '@/config/constants';

/**
 * Stories are not part of this build.
 *
 * Both screens previously ran on a hardcoded list of invented people. The
 * viewer screen was worse than the rail that fed it: when it was handed a
 * story id it did not recognise, it fell back to inventing one rather than
 * admitting it had nothing, so any address in the story range rendered a
 * plausible story that never existed.
 *
 * The list has been deleted and both screens now say what is true. The routes
 * are kept so an address that was already shared resolves to an explanation
 * instead of a fabrication or a crash. No surface links here any more.
 *
 * The backend implements stories in full. Nothing here is blocked on it.
 *
 * This treatment is derived. The design export defines no state for a feature
 * that is deliberately absent, so it reuses the centred-notice spacing, icon
 * sizing and muted foreground used by the empty states elsewhere.
 */
function StoriesUnavailable({ detail }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '48px 32px',
        textAlign: 'center',
        background: v.base,
      }}
    >
      <LxIcon name="image" size={36} color={v.ink3} />
      <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, maxWidth: 340, lineHeight: 1.5 }}>
        stories are not part of this build.
      </div>
      <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, maxWidth: 340, lineHeight: 1.5 }}>
        {detail}
      </div>
      <LxBtn variant="secondary" size="sm" onClick={() => navigate(ROUTES.FEED)}>
        back to feed
      </LxBtn>
    </div>
  );
}

export function StoryViewScreen() {
  return <StoriesUnavailable detail="there is no story at this address, and there was never one behind this link." />;
}

export function StoryComposerScreen() {
  return <StoriesUnavailable detail="posting a story will be possible once the feature is built." />;
}
