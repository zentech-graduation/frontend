import { useState } from 'react';
import { v } from '../constants/tokens';
import { NOTIFS } from '../constants/data';
import { LxIcon, LxAvatar, LxBtn } from './primitives';

const TYPE_ICON = {
  like: 'heart', follow: 'profile', follow_request: 'profile',
  comment: 'reply', mention: 'hash', story: 'eye',
};

const TYPE_COLOR = {
  like: '#C47168', follow: '#7A9E7A', follow_request: '#7A9E7A',
  comment: '#C8A97E', mention: '#9B7EA8', story: '#7A9EB8',
};

function NotifRow({ n, navigate }) {
  return (
    <div onClick={() => n.target && navigate('post')} style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px',
      background: n.unread ? 'var(--lx-accent-dim)' : 'transparent',
      cursor: n.target ? 'pointer' : 'default',
      borderBottom: `1px solid ${v.borderSubtle}`,
      position: 'relative',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <LxAvatar size={40} idx={n.idx} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: '50%',
          background: TYPE_COLOR[n.type],
          border: `2px solid var(--lx-base)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LxIcon name={TYPE_ICON[n.type]} size={10} color="#fff" stroke={2} filled={n.type === 'like'} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink, lineHeight: 1.4 }}>
          <strong style={{ fontWeight: 600 }}>{n.actor}</strong> <span style={{ color: v.ink2 }}>{n.text}</span>
        </div>
        {n.target && (
          <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            "{n.target}"
          </div>
        )}
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, marginTop: 4 }}>{n.time}</div>
      </div>

      {n.type === 'follow_request' && (
        <div style={{ display: 'flex', gap: 6, alignSelf: 'center', flexShrink: 0 }}>
          <LxBtn variant="primary" size="sm">accept</LxBtn>
          <LxBtn variant="ghost" size="sm">decline</LxBtn>
        </div>
      )}
    </div>
  );
}

export function NotificationsScreen({ navigate }) {
  const [tab, setTab] = useState('all');

  return (
    <>
      <div style={{ display: 'flex', borderBottom: `1px solid ${v.border}`, position: 'sticky', top: 0, background: v.base, zIndex: 5 }}>
        {['all', 'mentions', 'requests'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, fontFamily: v.fontBody, fontSize: 13, fontWeight: 500,
            color: tab === t ? v.ink : v.ink3,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 0',
            borderBottom: tab === t ? `2px solid var(--lx-ink)` : '2px solid transparent',
            marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 16px 6px' }}>today</div>
        {NOTIFS.slice(0, 3).map((n, i) => <NotifRow key={i} n={n} navigate={navigate} />)}

        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 16px 6px' }}>this week</div>
        {NOTIFS.slice(3).map((n, i) => <NotifRow key={i + 3} n={n} navigate={navigate} />)}
      </div>
    </>
  );
}
