import { useState } from 'react';
import { v } from '../constants/tokens';
import { PROFILE_POSTS } from '../constants/data';
import { LxBtn } from './primitives';

export function ProfileScreen({ navigate, params = {}, viewport }) {
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const user = params.user || {
    name: 'mara.v', handle: '@mara.v', idx: 0,
    bio: 'light, shadow, and the space between a thought and a word.',
    posts: 84, following: 240, followers: '8.4k',
  };
  const isSelf = !params.user;

  const cols = viewport === 'desktop' ? 3 : viewport === 'tablet' ? 3 : 3;

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Cover band */}
        <div style={{ height: 88, background: v.surfaceRaised }} />

        {/* Avatar + follow */}
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#C8A97E',
            border: `3px solid var(--lx-base)`,
            flexShrink: 0,
          }} />
          {!isSelf && (
            <LxBtn
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setFollowing(f => !f)}
              style={{ marginBottom: 8 }}>
              {following ? 'following' : 'follow'}
            </LxBtn>
          )}
          {isSelf && (
            <LxBtn variant="secondary" size="sm" style={{ marginBottom: 8 }} onClick={() => navigate('settings')}>
              edit profile
            </LxBtn>
          )}
        </div>

        {/* Name + bio */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: v.fontDisplay, fontSize: 22, fontWeight: 700, color: v.ink, letterSpacing: '-0.02em' }}>{user.name}</div>
          </div>
          <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 2 }}>{user.handle}</div>
          <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5, marginTop: 10, maxWidth: 480 }}>{user.bio}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28, padding: '16px 16px 16px', borderBottom: `1px solid ${v.border}` }}>
          {[['posts', user.posts], ['following', user.following], ['followers', user.followers]].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: v.fontMono, fontSize: 16, fontWeight: 500, color: v.ink }}>{val}</span>
              <span style={{ fontFamily: v.fontMono, fontSize: 9, color: v.ink3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${v.border}` }}>
          {['posts', 'photos', 'liked'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, fontFamily: v.fontBody, fontSize: 13, fontWeight: 500,
              color: tab === t ? v.ink : v.ink3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 0',
              borderBottom: tab === t ? `2px solid var(--lx-ink)` : '2px solid transparent',
              marginBottom: -1, letterSpacing: '0.01em',
            }}>{t}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, padding: 2 }}>
          {PROFILE_POSTS.map(p => (
            <div key={p.id} onClick={() => navigate('post')} style={{
              background: p.color,
              aspectRatio: p.tall ? '3/4' : '1/1',
              borderRadius: 4, cursor: 'pointer',
            }} />
          ))}
        </div>

        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
