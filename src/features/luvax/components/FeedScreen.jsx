import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '../constants/tokens';
import { STORIES } from '../constants/data';
import { LxIcon, LxAvatar, LxTag, LxBtn } from './primitives';
import { useFeed } from '../hooks/usePosts';

// ─── Stories Carousel ──────────────────────────────────────────────────────
export function StoriesCarousel({ navigate }) {
  return (
    <div style={{
      display: 'flex', gap: 14, overflowX: 'auto',
      padding: '14px 16px 16px',
      borderBottom: `1px solid ${v.border}`,
      flexShrink: 0, scrollbarWidth: 'none',
    }}>
      {STORIES.map(s => (
        <button key={s.id}
          onClick={() => s.isOwn ? navigate('story-compose') : navigate('story-view', { story: s })}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            flexShrink: 0, padding: 0,
          }}>
          {s.isOwn ? (
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: v.surface, border: `1px dashed ${v.borderStrong}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <LxIcon name="plus" size={20} color={v.ink2} />
            </div>
          ) : (
            <LxAvatar size={48} idx={s.idx} hasStory viewed={s.viewed} />
          )}
          <span style={{
            fontFamily: v.fontBody, fontSize: 11, fontWeight: 500,
            color: s.viewed ? v.ink3 : v.ink,
            maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.author}</span>
        </button>
      ))}
    </div>
  );
}

import { PostCard } from './PostCard';

// ─── Feed Screen ───────────────────────────────────────────────────────────
export function FeedScreen({ navigate, tweaks, viewport }) {
  const isMulti = viewport === 'tablet' || viewport === 'desktop';
  const gap = tweaks.density === 'dense' ? 8 : 12;
  const { ref, inView } = useInView();
  const { 
    data: feedResponse, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useFeed();
  
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten the infinite paginated response
  const posts = feedResponse?.pages?.flatMap(page => page?.data?.content || page?.content || []) || [];

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
        loading feed...
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: v.fontBody, fontSize: 14, color: v.error }}>
        Could not load feed. Is your backend server running?
      </div>
    );
  }

  return (
    <>
      <StoriesCarousel navigate={navigate} />

      <div style={{
        flex: 1, padding: '14px 16px',
        paddingBottom: 24,
      }}>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 2px 12px' }}>today</div>

        {isMulti ? (
          <div style={{
            columnCount: viewport === 'desktop' ? 2 : 2,
            columnGap: gap,
          }}>
            {posts.map(p => (
              <div key={p.id} style={{ breakInside: 'avoid', marginBottom: gap, display: 'inline-block', width: '100%' }}>
                <PostCard post={p} navigate={navigate} density={tweaks.density} showTags={tweaks.showTags} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {posts.map(p => (
              <PostCard key={p.id} post={p} navigate={navigate} density={tweaks.density} showTags={tweaks.showTags} />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div ref={ref} style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
            {isFetchingNextPage ? 'loading more...' : 'scroll for more'}
          </div>
        )}
      </div>
    </>
  );
}
