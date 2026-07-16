import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '../constants/tokens';
import { STORIES } from '../constants/data';
import { LxIcon, LxAvatar, LxTag, LxBtn } from './primitives';
import { useFeed } from '../hooks/usePosts';

// ─── Stories Carousel ──────────────────────────────────────────────────────
export function StoriesCarousel({ navigate, viewport }) {
  const isTablet = viewport === 'tablet';
  return (
    <div style={{
      display: 'flex', gap: isTablet ? 10 : 14, overflowX: 'auto',
      padding: isTablet ? '12px 12px 10px' : '14px 14px 12px',
      borderBottom: `1px solid ${v.border}`,
      flexShrink: 0, scrollbarWidth: 'none',
    }}>
      {STORIES.map(s => (
        <button key={s.id}
          onClick={() => s.isOwn ? navigate('story-compose') : navigate('story-view', { story: s })}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isTablet ? 5 : 6,
            flexShrink: 0, padding: 0,
          }}>
          {s.isOwn ? (
            <div style={{
              width: isTablet ? 48 : 54, height: isTablet ? 48 : 54, borderRadius: '50%',
              background: v.surface, border: `1px solid ${v.borderStrong}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <LxIcon name="plus" size={isTablet ? 18 : 20} color={v.ink2} />
            </div>
          ) : (
            <LxAvatar size={isTablet ? 44 : 48} idx={s.idx} hasStory viewed={s.viewed} />
          )}
          <span style={{
            fontFamily: v.fontBody, fontSize: isTablet ? 10 : 11, fontWeight: 500,
            color: s.viewed ? v.ink3 : v.ink,
            maxWidth: isTablet ? 52 : 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
  const isMobile = viewport === 'mobile';
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
      <StoriesCarousel navigate={navigate} viewport={viewport} />

      <div style={{
        flex: 1, padding: isMobile ? '10px 0 24px' : '14px 16px',
        paddingBottom: 24,
      }}>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: isMobile ? '0 14px 12px' : '2px 2px 12px' }}>today</div>

        {isMulti ? (
          <div style={{
            columnCount: viewport === 'desktop' ? 2 : 2,
            columnGap: gap,
          }}>
            {posts.map(p => (
              <div key={p.id} style={{ breakInside: 'avoid', marginBottom: gap, display: 'inline-block', width: '100%' }}>
                <PostCard post={p} navigate={navigate} density={tweaks.density} showTags={tweaks.showTags} viewport={viewport} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {posts.map(p => (
              <PostCard key={p.id} post={p} navigate={navigate} density={tweaks.density} showTags={tweaks.showTags} viewport={viewport} />
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
