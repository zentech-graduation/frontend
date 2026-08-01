import { v } from '@/config/tokens';
import { LxIcon, LxBtn } from './primitives';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/authApi';
import { clearAuthAndRedirect } from '@/api/axiosClient';
import { extractPageContent } from '@/utils/helpers';
import { useBlockedUsers } from '../hooks/useSocial';

// ─── Toggle ─────────────────────────────────────────────────────────────────
function Toggle({ on, onChange, disabled = false }) {
  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : (e => { e.stopPropagation(); onChange(!on); })}
      style={{
        width: 38, height: 22, borderRadius: 999,
        background: on ? v.accent : v.surfaceRaised,
        border: 'none', position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 150ms ease-out',
      }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 18, height: 18, borderRadius: '50%', background: v.white,
        transition: 'left 150ms ease-out',
        boxShadow: `0 1px 3px ${v.shadow18}`,
      }} />
    </button>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ children, note }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 8,
      padding: '20px 16px 8px',
    }}>
      <span style={{
        fontFamily: v.fontMono, fontSize: 10, color: v.ink3,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{children}</span>
      {note && (
        <span style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>{note}</span>
      )}
    </div>
  );
}

// ─── Settings Row ────────────────────────────────────────────────────────────
function SettingsRow({ label, sub, control, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px',
      borderBottom: `1px solid ${v.borderSubtle}`,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink }}>{label}</div>
        {sub && <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, marginTop: 2 }}>{sub}</div>}
      </div>
      {control}
    </div>
  );
}

// ─── Settings Screen ─────────────────────────────────────────────────────────
export function SettingsScreen({ navigate, tweaks, setTweak }) {
  const queryClient = useQueryClient();
  const logout = useAuthStore(state => state.logout);

  const handleSignOut = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    }
    queryClient.clear();
    clearAuthAndRedirect();
  };
  
  const currentUser = useAuthStore(state => state.user);

  const { data: blockedResponse } = useBlockedUsers();
  const blocks = extractPageContent(blockedResponse);

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
        <SettingsRow label="edit profile" control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => navigate('edit-profile')} />
        <SettingsRow label="change password" control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => navigate('change-password')} />
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
          control={
            <Toggle
              on={Boolean(tweaks?.dark)}
              onChange={handleDarkModeToggle}
            />
          }
        />

        {/* Privacy */}
        <SectionHeader note="coming soon">privacy</SectionHeader>
        <SettingsRow
          label="private account"
          sub="only approved followers can see your posts"
          control={<Toggle on={false} onChange={() => {}} disabled />}
        />
        <SettingsRow
          label="show activity status"
          sub="let people see when you were last active"
          control={<Toggle on={true} onChange={() => {}} disabled />}
        />
        <SettingsRow
          label="allow story replies"
          sub="people can dm you in response to stories"
          control={<Toggle on={true} onChange={() => {}} disabled />}
        />
        <SettingsRow
          label="allow message requests"
          sub="people you don't follow can dm you"
          control={<Toggle on={true} onChange={() => {}} disabled />}
        />
        <SettingsRow label="blocked users" sub={`${blocks.length} blocked`} control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => navigate('blocked')} />

        {/* Notifications */}
        <SectionHeader note="coming soon">notifications</SectionHeader>
        <SettingsRow label="likes" control={<Toggle on={true} onChange={() => {}} disabled />} />
        <SettingsRow label="comments & replies" control={<Toggle on={true} onChange={() => {}} disabled />} />
        <SettingsRow label="new followers" control={<Toggle on={true} onChange={() => {}} disabled />} />
        <SettingsRow label="mentions" control={<Toggle on={true} onChange={() => {}} disabled />} />
        <SettingsRow label="story views" control={<Toggle on={false} onChange={() => {}} disabled />} />
        <SettingsRow label="messages" control={<Toggle on={true} onChange={() => {}} disabled />} />

        {/* Support */}
        <SectionHeader>support</SectionHeader>
        <SettingsRow label="help center" control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => {}} />
        <SettingsRow label="terms & privacy" control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => {}} />
        <SettingsRow label="about luvax" control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => {}} />

        {/* Danger */}
        <div style={{ padding: '32px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleSignOut} style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 500, color: v.ink2, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '6px 0' }}>sign out</button>
          <button style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 500, color: v.error, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '6px 0' }}>delete account</button>
        </div>

        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, textAlign: 'center', padding: '20px 16px' }}>luvax · v1.0 · 2026</div>
      </div>
    </>
  );
}
