import { useNavigate } from 'react-router-dom';
import { v } from '@/config/tokens';
import { ROUTES } from '@/config/constants';
import { LxIcon, LxBtn } from './primitives';
import { LxToggle } from '@/components/ui/lx-toggle';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/authApi';
import { clearAuthAndRedirect } from '@/api/axiosClient';
import { extractPageContent } from '@/utils/helpers';
import { useBlockedUsers } from '../hooks/useSocial';
import { useLuvaxTweaks } from '../LuvaxTweaksContext';
import { useMyProfile, useUpdateMyProfile } from '../hooks/useUsers';
import { useMySettings, useUpdateMySettings } from '../hooks/useSettings';

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ children, note }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '20px 16px 8px',
      }}
    >
      <span
        style={{
          fontFamily: v.fontMono,
          fontSize: 10,
          color: v.ink3,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </span>
      {note && <span style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>{note}</span>}
    </div>
  );
}

// ─── Settings Row ────────────────────────────────────────────────────────────
function SettingsRow({ label, sub, control, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: `1px solid ${v.borderSubtle}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink }}>{label}</div>
        {sub && (
          <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {control}
    </div>
  );
}

// ─── Settings Screen ─────────────────────────────────────────────────────────
export function SettingsScreen() {
  const navigate = useNavigate();
  const { tweaks, setTweak } = useLuvaxTweaks();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  const handleSignOut = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    }
    queryClient.clear();
    clearAuthAndRedirect();
  };

  const currentUser = useAuthStore((state) => state.user);

  const { data: blockedResponse } = useBlockedUsers();
  const blocks = extractPageContent(blockedResponse);

  // The public/list shapes omit or restrict isPrivate, so the self view is
  // the only source for it; the auth store's session user is deliberately
  // never widened to carry it (see LuvaxApp's own avatar/banner-only merge).
  const { data: myProfileResponse } = useMyProfile();
  const myProfile = myProfileResponse?.data || myProfileResponse;
  const updateProfile = useUpdateMyProfile();

  const { data: settingsResponse } = useMySettings();
  const settings = settingsResponse?.data || settingsResponse;
  const updateSettings = useUpdateMySettings();

  const handleDarkModeToggle = (value) => {
    localStorage.setItem('lxDarkManual', '1');
    if (setTweak) {
      setTweak('dark', value);
    }
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        {/* Account */}
        <SectionHeader>account</SectionHeader>
        <SettingsRow
          label="edit profile"
          control={<LxIcon name="chevronRight" size={16} color={v.ink3} />}
          onClick={() => navigate(ROUTES.EDIT_PROFILE)}
        />
        <SettingsRow
          label="change password"
          control={<LxIcon name="chevronRight" size={16} color={v.ink3} />}
          onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}
        />
        <SettingsRow
          label="saved"
          sub="posts you bookmarked"
          control={<LxIcon name="chevronRight" size={16} color={v.ink3} />}
          onClick={() => navigate(ROUTES.SAVED)}
        />
        <SettingsRow
          label="email"
          sub={`${currentUser?.email ?? '—'}${currentUser?.isVerified ? ' · verified' : ''}`}
          control={<LxIcon name="check" size={16} color={v.success} />}
        />

        {/* Appearance */}
        <SectionHeader>appearance</SectionHeader>
        <SettingsRow
          label="dark mode"
          sub="follows system · toggle to override"
          control={<LxToggle on={Boolean(tweaks?.dark)} onChange={handleDarkModeToggle} />}
        />

        {/* Privacy */}
        <SectionHeader>privacy</SectionHeader>
        <SettingsRow
          label="private account"
          sub="only approved followers can see your posts"
          control={
            <LxToggle
              on={Boolean(myProfile?.isPrivate)}
              onChange={(value) => updateProfile.mutate({ isPrivate: value })}
              disabled={!myProfile}
            />
          }
        />
        <SettingsRow
          label="show activity status"
          sub="let people see when you were last active"
          control={
            <LxToggle
              on={settings ? Boolean(settings.showActivityStatus) : true}
              onChange={(value) => updateSettings.mutate({ showActivityStatus: value })}
              disabled={!settings}
            />
          }
        />
        <SettingsRow
          label="allow story replies"
          sub="people can dm you in response to stories"
          control={
            <LxToggle
              on={settings ? Boolean(settings.allowStoryReplies) : true}
              onChange={(value) => updateSettings.mutate({ allowStoryReplies: value })}
              disabled={!settings}
            />
          }
        />
        <SettingsRow
          label="allow message requests"
          sub="people you don't follow can dm you"
          control={
            <LxToggle
              on={settings ? Boolean(settings.allowMessageRequests) : true}
              onChange={(value) => updateSettings.mutate({ allowMessageRequests: value })}
              disabled={!settings}
            />
          }
        />
        <SettingsRow
          label="blocked users"
          sub={`${blocks.length} blocked`}
          control={<LxIcon name="chevronRight" size={16} color={v.ink3} />}
          onClick={() => navigate(ROUTES.BLOCKED_USERS)}
        />

        {/* Notifications */}
        <SectionHeader>notifications</SectionHeader>
        <SettingsRow
          label="likes"
          control={
            <LxToggle
              on={settings ? Boolean(settings.notifyLikes) : true}
              onChange={(value) => updateSettings.mutate({ notifyLikes: value })}
              disabled={!settings}
            />
          }
        />
        <SettingsRow
          label="comments & replies"
          control={
            <LxToggle
              on={settings ? Boolean(settings.notifyComments) : true}
              onChange={(value) => updateSettings.mutate({ notifyComments: value })}
              disabled={!settings}
            />
          }
        />
        <SettingsRow
          label="new followers"
          control={
            <LxToggle
              on={settings ? Boolean(settings.notifyFollows) : true}
              onChange={(value) => updateSettings.mutate({ notifyFollows: value })}
              disabled={!settings}
            />
          }
        />
        <SettingsRow
          label="mentions"
          control={
            <LxToggle
              on={settings ? Boolean(settings.notifyMentions) : true}
              onChange={(value) => updateSettings.mutate({ notifyMentions: value })}
              disabled={!settings}
            />
          }
        />
        {/* Story views has no backend field to bind to - notify_* covers
            likes/comments/follows/mentions/messages only - so it stays a
            placeholder rather than wiring to something that doesn't exist. */}
        <SettingsRow
          label="story views"
          sub="coming soon"
          control={<LxToggle on={false} onChange={() => {}} disabled />}
        />
        <SettingsRow
          label="messages"
          control={
            <LxToggle
              on={settings ? Boolean(settings.notifyMessages) : true}
              onChange={(value) => updateSettings.mutate({ notifyMessages: value })}
              disabled={!settings}
            />
          }
        />

        {/* Support */}
        <SectionHeader>support</SectionHeader>
        <SettingsRow
          label="help center"
          control={<LxIcon name="chevronRight" size={16} color={v.ink3} />}
          onClick={() => {}}
        />
        <SettingsRow
          label="terms & privacy"
          control={<LxIcon name="chevronRight" size={16} color={v.ink3} />}
          onClick={() => {}}
        />
        <SettingsRow
          label="about luvax"
          control={<LxIcon name="chevronRight" size={16} color={v.ink3} />}
          onClick={() => {}}
        />

        {/* Danger - set apart from the ordinary settings above by a rule, not just extra
            padding, so sign-out and delete-account don't read as one more row in the same list. */}
        <div style={{ margin: '24px 16px 0', borderTop: `1px solid ${v.border}` }} />
        <div
          style={{ padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <button
            onClick={handleSignOut}
            style={{
              fontFamily: v.fontBody,
              fontSize: 14,
              fontWeight: 500,
              color: v.ink2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '6px 0',
            }}
          >
            sign out
          </button>
          <button
            style={{
              fontFamily: v.fontBody,
              fontSize: 14,
              fontWeight: 500,
              color: v.error,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '6px 0',
            }}
          >
            delete account
          </button>
        </div>

        <div
          style={{
            fontFamily: v.fontMono,
            fontSize: 10,
            color: v.ink3,
            textAlign: 'center',
            padding: '20px 16px',
          }}
        >
          luvax · v1.0 · 2026
        </div>
      </div>
    </>
  );
}
