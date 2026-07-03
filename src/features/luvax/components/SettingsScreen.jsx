import { useState } from 'react';
import { v } from '../constants/tokens';
import { LxIcon, LxBtn } from './primitives';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Toggle ─────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button onClick={e => { e.stopPropagation(); onChange(!on); }} style={{
      width: 38, height: 22, borderRadius: 999,
      background: on ? v.accent : v.surfaceRaised,
      border: 'none', position: 'relative', cursor: 'pointer',
      transition: 'background 150ms ease-out',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 150ms ease-out',
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      }} />
    </button>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ children }) {
  return (
    <div style={{
      fontFamily: v.fontMono, fontSize: 10, color: v.ink3,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '20px 16px 8px',
    }}>{children}</div>
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
export function SettingsScreen({ navigate }) {
  const [s, setS] = useState({
    isPrivate: false,
    notifyLikes: true,
    notifyComments: true,
    notifyFollows: true,
    notifyMentions: true,
    notifyStoryViews: false,
    notifyMessages: true,
    showActivity: true,
    allowStoryReplies: true,
    allowMessageRequests: true,
  });
  const set = (k) => (val) => setS(p => ({ ...p, [k]: val }));
  
  const queryClient = useQueryClient();
  const logout = useAuthStore(state => state.logout);

  const handleSignOut = () => {
    queryClient.clear();
    logout();
  };
  
  const currentUser = useAuthStore(state => state.user);
  const key = currentUser ? `lx_blocks_${currentUser.id}` : 'lx_blocks';
  const blocks = JSON.parse(localStorage.getItem(key) || '[]');

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        {/* Account */}
        <SectionHeader>account</SectionHeader>
        <SettingsRow label="edit profile" control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => {}} />
        <SettingsRow label="change password" control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => {}} />
        <SettingsRow
          label="email"
          sub="mara@example.com · verified"
          control={<LxIcon name="check" size={16} color={v.success} />}
        />

        {/* Privacy */}
        <SectionHeader>privacy</SectionHeader>
        <SettingsRow
          label="private account"
          sub="only approved followers can see your posts"
          control={<Toggle on={s.isPrivate} onChange={set('isPrivate')} />}
        />
        <SettingsRow
          label="show activity status"
          sub="let people see when you were last active"
          control={<Toggle on={s.showActivity} onChange={set('showActivity')} />}
        />
        <SettingsRow
          label="allow story replies"
          sub="people can dm you in response to stories"
          control={<Toggle on={s.allowStoryReplies} onChange={set('allowStoryReplies')} />}
        />
        <SettingsRow
          label="allow message requests"
          sub="people you don't follow can dm you"
          control={<Toggle on={s.allowMessageRequests} onChange={set('allowMessageRequests')} />}
        />
        <SettingsRow label="blocked users" sub={`${blocks.length} blocked`} control={<LxIcon name="chevronRight" size={16} color={v.ink3} />} onClick={() => navigate('blocked')} />

        {/* Notifications */}
        <SectionHeader>notifications</SectionHeader>
        <SettingsRow label="likes" control={<Toggle on={s.notifyLikes} onChange={set('notifyLikes')} />} />
        <SettingsRow label="comments & replies" control={<Toggle on={s.notifyComments} onChange={set('notifyComments')} />} />
        <SettingsRow label="new followers" control={<Toggle on={s.notifyFollows} onChange={set('notifyFollows')} />} />
        <SettingsRow label="mentions" control={<Toggle on={s.notifyMentions} onChange={set('notifyMentions')} />} />
        <SettingsRow label="story views" control={<Toggle on={s.notifyStoryViews} onChange={set('notifyStoryViews')} />} />
        <SettingsRow label="messages" control={<Toggle on={s.notifyMessages} onChange={set('notifyMessages')} />} />

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
