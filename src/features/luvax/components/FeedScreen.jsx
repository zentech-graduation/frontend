import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { LxIcon, LxAvatar, LxTag, LxBtn } from './primitives';
import { useFeed } from '../hooks/usePosts';
import { useOverlayNavigate } from '../hooks/useOverlayNavigate';
import { useLuvaxTweaks } from '../LuvaxTweaksContext';
import { ROUTES, routeTo } from '@/config/constants';

// ─── Stories Carousel ──────────────────────────────────────────────────────
/**
 * The story rail is gone.
 *
 * It was built from a hardcoded list of invented people and linked each one to
 * a story id that does not exist, so opening any of them landed the viewer on
 * an error. Stories are out of scope for this build, so the rail is not
 * replaced with a server-backed one; it is removed, and the feed starts at the
 * posts. An empty rail was rejected because a row of empty rings still asserts
 * that stories are a thing this build does.
 *
 * See docs/social-states-and-tabs/fabricated-data-removal.md.
 */

import { PostCard } from './PostCard';

// The single-column content width, before the root scale is applied. The root
// zoom multiplies it, so the rendered column reads near the photo-first target
// the owner asked for. See docs/layout-overhaul/layout-decisions.md.
const FEED_COLUMN = 412;

// ─── Feed Screen ───────────────────────────────────────────────────────────
export function FeedScreen() {
  const { tweaks, viewport } = useLuvaxTweaks();
  const isMobile = viewport === 'mobile';
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
  const posts = feedResponse?.pages?.flatMap(page => extractPageContent(page)) || [];

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
        we couldn't load your feed. check your connection and try again.
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      // Geometry is the design's own empty state, taken from Explore: padding
      // 48px 24px, title body 15 weight 500 in v.ink2, subtitle body 13 in
      // v.ink3. Only the copy is new, because the design defines no empty feed.
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 500, color: v.ink2, marginBottom: 4 }}>
          your feed is quiet
        </div>
        <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink3 }}>
          follow a few people and their posts will appear here
        </div>
      </div>
    );
  }

  // One centred column, not a masonry. The content column is capped so the feed
  // reads like a photo-first single stream. Posts are separated by a large gap
  // between them against a much smaller gap inside each post, so the eye groups a
  // post without any divider or card. The ratio is roughly 5:1. See
  // docs/layout-overhaul/layout-decisions.md.
  const betweenPosts = isMobile ? 44 : 56;

  return (
    <div style={{
      flex: 1,
      padding: isMobile ? '8px 0 48px' : '20px 0 56px',
    }}>
      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : FEED_COLUMN, margin: '0 auto' }}>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: isMobile ? '0 14px 16px' : '0 4px 16px' }}>today</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: betweenPosts }}>
          {posts.map(p => (
            <PostCard key={p.id} post={p} density={tweaks.density} showTags={tweaks.showTags} viewport={viewport} />
          ))}
        </div>

        {hasNextPage && (
          <div ref={ref} style={{ padding: '28px 20px', textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
            {isFetchingNextPage ? 'loading more...' : 'scroll for more'}
          </div>
        )}
      </div>
    </div>
  );
}
