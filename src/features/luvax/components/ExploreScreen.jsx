import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '../constants/tokens';
import { TOPICS } from '../constants/data';
import { LxIcon, LxAvatar, LxTag } from './primitives';
import { useExplore } from '../hooks/usePosts';

function MiniCard({ p, navigate }) {
  const authorName = p.username || p.author || 'Unknown';
  const avatarUrl = p.userAvatarUrl;
  const mediaUrl = p.media && p.media.length > 0 ? p.media[0].cdnUrl : null;

  return (
    <div onClick={() => navigate('post', { post: p })} style={{
      background: v.surface, borderRadius: 10, overflow: 'hidden',
      cursor: 'pointer', breakInside: 'avoid', marginBottom: 8,
      display: 'inline-block', width: '100%',
    }}>
      {mediaUrl && (
        p.media[0].mediaType === 'VIDEO' ? (
          <video src={mediaUrl} style={{ width: '100%', display: 'block' }} muted />
        ) : (
          <img src={mediaUrl} style={{ width: '100%', display: 'block' }} alt="post" />
        )
      )}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }} 
             onClick={(e) => { e.stopPropagation(); navigate('profile', { user: { id: p.userId, username: p.username, displayName: authorName, avatarUrl } }); }}>
          <LxAvatar size={18} src={avatarUrl} idx={p.idx || 0} />
          <span style={{ fontFamily: v.fontBody, fontSize: 11, fontWeight: 500, color: v.ink2, cursor: 'pointer' }}>{authorName}</span>
        </div>
        <p style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink, lineHeight: 1.5, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.caption || p.text}</p>
      </div>
    </div>
  );
}

export function ExploreScreen({ navigate, viewport }) {
  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState(null);

  const { ref, inView } = useInView();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useExplore({ q: query });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages?.flatMap(page => page?.data?.content || page?.content || []) || [];

  const cols = viewport === 'desktop' ? 3 : 2;

  return (
    <>
      <div style={{
        padding: '12px 16px 14px',
        background: v.base,
        borderBottom: `1px solid ${v.border}`,
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <LxIcon name="explore" size={15} color={v.ink3} />
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="search people, hashtags..."
            style={{
              width: '100%', fontFamily: v.fontBody, fontSize: 15, color: v.ink,
              background: v.surfaceSunken, border: `1px solid ${v.border}`,
              borderRadius: 999, padding: '10px 14px 10px 34px',
              outline: 'none', boxSizing: 'border-box',
            }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Topic chips */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TOPICS.map(t => (
            <LxTag key={t} active={activeTopic === t} onClick={() => setActiveTopic(activeTopic === t ? null : t)}>
              #{t}
            </LxTag>
          ))}
        </div>

        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 16px 12px' }}>
          trending today
        </div>

        {/* Masonry grid */}
        <div style={{ padding: '0 16px 24px', columnCount: cols, columnGap: 8 }}>
          {posts.map((p, i) => <MiniCard key={p.id || i} p={p} navigate={navigate} />)}
        </div>

        {hasNextPage && (
          <div ref={ref} style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
            {isFetchingNextPage ? 'loading more...' : 'scroll for more'}
          </div>
        )}
      </div>
    </>
  );
}
