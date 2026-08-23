import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { LxIcon, LxAvatar } from './primitives';
import { useFeed } from '../hooks/usePosts';
import { useStoryFeed } from '../hooks/useStories';
import { useOverlayNavigate } from '../hooks/useOverlayNavigate';
import { useLuvaxTweaks } from '../LuvaxTweaksContext';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES, routeTo } from '@/config/constants';

// ─── Stories Carousel ──────────────────────────────────────────────────────
// The rail sits at the top of the feed, as it does on Instagram. Backed by the
// real story tray: the viewer's own entry is pinned first by the API when they
// have an active story, otherwise a plain "add story" ring opens the composer.
export function StoriesCarousel({ viewport }) {
  const openOverlay = useOverlayNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { tray } = useStoryFeed();
  const isTablet = viewport === 'tablet';
  // Larger avatars and a taller rail for presence, trimmed about 12% from the
  // previous size on the owner's note that they read a touch too big.
  const avatar = isTablet ? 51 : 58;
  const ownRing = avatar + 6;

  const hasOwnEntry = tray.length > 0 && tray[0].userId === currentUser?.id;
  const others = hasOwnEntry ? tray.slice(1) : tray;

  return (
    <div
      style={{
        display: 'flex',
        gap: isTablet ? 12 : 16,
        overflowX: 'auto',
        padding: isTablet ? '6px 2px 20px' : '8px 2px 24px',
        flexShrink: 0,
        scrollbarWidth: 'none',
        // Centre the avatars in the wider rail. When the set outgrows the rail it
        // scrolls; new stories entering on the left stay reachable by scrolling.
        justifyContent: 'safe center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 7,
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'relative', width: ownRing, height: ownRing }}>
          <button
            onClick={() =>
              hasOwnEntry
                ? openOverlay(routeTo.storyView(tray[0].stories[0].id))
                : openOverlay(ROUTES.STORY_COMPOSE)
            }
            aria-label={hasOwnEntry ? 'view your story' : 'add story'}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {hasOwnEntry ? (
              <LxAvatar size={avatar} src={currentUser?.avatarUrl} hasStory viewed={false} />
            ) : (
              <div
                style={{
                  width: ownRing,
                  height: ownRing,
                  borderRadius: '50%',
                  background: currentUser?.avatarUrl
                    ? `url(${currentUser.avatarUrl}) center/cover no-repeat`
                    : v.surface,
                  border: `1px solid ${v.borderStrong}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {currentUser?.avatarUrl ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: v.black40,
                    }}
                  />
                ) : null}
                <LxIcon
                  name="plus"
                  size={isTablet ? 20 : 22}
                  color={currentUser?.avatarUrl ? v.white : v.ink2}
                  style={{ position: 'relative' }}
                />
              </div>
            )}
          </button>
          {hasOwnEntry ? (
            <button
              onClick={() => openOverlay(ROUTES.STORY_COMPOSE)}
              aria-label="add story"
              style={{
                position: 'absolute',
                right: -1,
                bottom: -1,
                width: 23,
                height: 23,
                borderRadius: '50%',
                border: `2px solid ${v.base}`,
                background: v.accent,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <LxIcon name="plus" size={13} color={v.ink} />
            </button>
          ) : null}
        </div>
        <span
          style={{
            fontFamily: v.fontBody,
            fontSize: isTablet ? 11 : 12,
            fontWeight: 500,
            color: v.ink,
            maxWidth: avatar + 16,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          your story
        </span>
      </div>
      {others.map((entry) => (
        <button
          key={entry.userId}
          onClick={() => openOverlay(routeTo.storyView(entry.stories[0].id))}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 7,
            flexShrink: 0,
            padding: 0,
          }}
        >
          <LxAvatar size={avatar} src={entry.userAvatarUrl} hasStory viewed={!entry.hasUnseen} />
          <span
            style={{
              fontFamily: v.fontBody,
              fontSize: isTablet ? 11 : 12,
              fontWeight: 500,
              color: entry.hasUnseen ? v.ink : v.ink3,
              maxWidth: avatar + 16,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.userDisplayName || entry.username}
          </span>
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
    isFetchingNextPage,
  } = useFeed();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten the infinite paginated response
  const posts = feedResponse?.pages?.flatMap((page) => extractPageContent(page)) || [];

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          fontFamily: v.fontMono,
          fontSize: 12,
          color: v.ink3,
        }}
      >
        loading feed...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          fontFamily: v.fontBody,
          fontSize: 14,
          color: v.error,
        }}
      >
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
        <div
          style={{
            fontFamily: v.fontBody,
            fontSize: 15,
            fontWeight: 500,
            color: v.ink2,
            marginBottom: 4,
          }}
        >
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
    <div
      style={{
        flex: 1,
        padding: isMobile ? '8px 0 48px' : '20px 0 56px',
      }}
    >
      {/* The story rail sits in a wider band than the post column below it. */}
      <div
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : STORY_RAIL_WIDTH,
          margin: '0 auto',
          padding: isMobile ? '0 12px' : '0 8px',
        }}
      >
        <StoriesCarousel viewport={viewport} />
      </div>

      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : FEED_COLUMN, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: v.fontMono,
            fontSize: 10,
            color: v.ink3,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: isMobile ? '0 14px 16px' : '0 4px 16px',
          }}
        >
          today
        </div>

        <div
          className="lx-fade-in"
          style={{ display: 'flex', flexDirection: 'column', gap: betweenPosts }}
        >
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              density={tweaks.density}
              showTags={tweaks.showTags}
              viewport={viewport}
            />
          ))}
        </div>

        {hasNextPage && (
          <div
            ref={ref}
            style={{
              padding: '28px 20px',
              textAlign: 'center',
              fontFamily: v.fontMono,
              fontSize: 12,
              color: v.ink3,
            }}
          >
            {isFetchingNextPage ? 'loading more...' : 'scroll for more'}
          </div>
        )}
      </div>
    </div>
  );
}
