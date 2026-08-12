import { v } from '@/config/tokens';
import { LxIcon } from '@/features/luvax/components/primitives';

/**
 * Messages is not part of this build.
 *
 * This screen previously rendered a set of invented conversations from invented
 * people, complete with photographs of real strangers taken from an image host
 * and presented as their avatars. It was reachable from the navigation, and the
 * conversation info panel offered "view profile" on those invented people,
 * which navigated to a profile id that does not exist and landed the viewer on
 * an error.
 *
 * The data has been deleted rather than hidden behind a flag. Hidden mock data
 * comes back: someone re-enables the panel and the strangers return. Deleting
 * it means the only way to put a conversation on this screen is to read one
 * from the server, which is what building the feature would involve anyway.
 *
 * The backend implements messaging in full. Nothing here is blocked on it. The
 * feature is out of scope for this build, and this screen says exactly that
 * rather than showing a plausible substitute.
 *
 * The panel components under ./components are left in place and unimported.
 * They are real UI with no data source, and removing them is a restructuring
 * this phase does not take on. See
 * docs/social-states-and-tabs/deferred-findings.md.
 *
 * This treatment is derived. The design export defines no state for a feature
 * that is deliberately absent, so it reuses the centred-notice spacing, icon
 * sizing and muted foreground the empty states elsewhere already use.
 */
export function MessagesScreen() {
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
      <LxIcon name="chat" size={36} color={v.ink3} />
      <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, maxWidth: 340, lineHeight: 1.5 }}>
        messages are not part of this build.
      </div>
      <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, maxWidth: 340, lineHeight: 1.5 }}>
        nothing has been sent to you and nothing is hidden. this screen will stay empty until
        the feature is built.
      </div>
    </div>
  );
}
