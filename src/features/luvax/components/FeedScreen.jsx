import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { LxIcon, LxAvatar, LxTag, LxBtn } from './primitives';
import { useFeed } from '../hooks/usePosts';
import { useOverlayNavigate } from '../hooks/useOverlayNavigate';
import { useLuvaxTweaks } from '../LuvaxTweaksContext';
import { STORIES } from '../constants/data';
import { ROUTES, routeTo } from '@/config/constants';

// ─── Stories Carousel ──────────────────────────────────────────────────────
// Restored on the owner's direction. The rail sits at the top of the feed, as it
// does on Instagram, and runs on its presentation data without live wiring yet.
export function StoriesCarousel({ viewport }) {
  const openOverlay = useOverlayNavigate();
  const isTablet = viewport === 'tablet';
  // Larger avatars and a taller rail for presence, trimmed about 12% from the
  // previous size on the owner's note that they read a touch too big.
  const avatar = isTablet ? 51 : 58;
  const ownRing = avatar + 6;
  return (
    <div style={{
      display: 'flex', gap: isTablet ? 12 : 16, overflowX: 'auto',
      padding: isTablet ? '6px 2px 20px' : '8px 2px 24px',
      flexShrink: 0, scrollbarWidth: 'none',
      // Centre the avatars in the wider rail. When the set outgrows the rail it
      // scrolls; new stories entering on the left stay reachable by scrolling.
      justifyContent: 'safe center',
    }}>
      {STORIES.map(s => (
        <button key={s.id}
          onClick={() => s.isOwn ? openOverlay(ROUTES.STORY_COMPOSE) : openOverlay(routeTo.storyView(s.id))}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
            flexShrink: 0, padding: 0,
          }}>
          {s.isOwn ? (
            <div style={{
              width: ownRing, height: ownRing, borderRadius: '50%',
              background: v.surface, border: `1px solid ${v.borderStrong}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <LxIcon name="plus" size={isTablet ? 20 : 22} color={v.ink2} />
            </div>
          ) : (
            <LxAvatar size={avatar} idx={s.idx} hasStory viewed={s.viewed} />
          )}
          <span style={{
            fontFamily: v.fontBody, fontSize: isTablet ? 11 : 12, fontWeight: 500,
            color: s.viewed ? v.ink3 : v.ink,
            maxWidth: avatar + 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.author}</span>
        </button>
      ))}
    </div>
  );
}

import { PostCard } from './PostCard';

// The single-column content width, before the root scale is applied. The root
// zoom multiplies it, so the rendered column reads near the photo-first target
// the owner asked for. See docs/layout-overhaul/layout-decisions.md.
const FEED_COLUMN = 412;

// The story rail spans wider than the post column, so it reads as its own band
// across the top of the feed rather than sitting inside the post width.
const STORY_RAIL_WIDTH = 632;

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
  // Mobile has little room, so the space between posts is much tighter than the
  // generous desktop gap. The within-post grouping still reads because the gap
  // between posts stays clearly larger than the gaps inside one.
  const betweenPosts = isMobile ? 22 : 56;

  return (
    <div style={{
      flex: 1,
      padding: isMobile ? '8px 0 48px' : '20px 0 56px',
    }}>
      {/* The story rail sits in a wider band than the post column below it. */}
      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : STORY_RAIL_WIDTH, margin: '0 auto', padding: isMobile ? '0 12px' : '0 8px' }}>
        <StoriesCarousel viewport={viewport} />
      </div>

      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : FEED_COLUMN, margin: '0 auto' }}>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: isMobile ? '0 14px 16px' : '0 4px 16px' }}>today</div>

        <div className="lx-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: betweenPosts }}>
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
