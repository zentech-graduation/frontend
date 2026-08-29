import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { LxIcon, LxAvatar } from './primitives';
import { useFeed, useForYouFeed } from '../hooks/usePosts';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';
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

/**
 * One tab's post list: loading, error, empty, and paginated grid states.
 *
 * Both tabs stay mounted at once (see FeedScreen below) so switching tabs
 * never unmounts either list, which is what keeps each tab's scroll
 * position from resetting when the other becomes active. `active` only
 * controls visibility (display: none), never mount/unmount.
 *
 * `isRecommended` gates the 429 cooldown handling: the Following tab's
 * existing follow-based endpoint keeps its unchanged retry/error behavior,
 * while the recommendation-backed For You tab respects Retry-After and
 * stops requesting during a cooldown window rather than retrying and
 * risking a request loop.
 */
function FeedTabPanel({
  active,
  isMobile,
  betweenPosts,
  tweaks,
  viewport,
  isRecommended,
  emptyTitle,
  emptySubtitle,
  query,
}) {
  const { ref, inView } = useInView();
  const { cooling, remaining, start } = useRateLimitCooldown();
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  useEffect(() => {
    if (!active) return;
    if (inView && hasNextPage && !isFetchingNextPage && !(isRecommended && cooling)) {
      fetchNextPage();
    }
  }, [active, inView, hasNextPage, isFetchingNextPage, isRecommended, cooling, fetchNextPage]);

  useEffect(() => {
    if (isRecommended && isError && error?.response?.status === 429) {
      const retryAfter = Number(error.response.headers?.['retry-after']);
      start(retryAfter);
    }
  }, [isRecommended, isError, error, start]);

  const posts = data?.pages?.flatMap((page) => extractPageContent(page)) || [];

  return (
    <div style={{ display: active ? 'block' : 'none' }}>
      {isLoading ? (
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
      ) : isError ? (
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
          {isRecommended && cooling
            ? `too many requests. try again in ${remaining}s.`
            : "we couldn't load your feed. check your connection and try again."}
        </div>
      ) : posts.length === 0 ? (
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
            {emptyTitle}
          </div>
          <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink3 }}>{emptySubtitle}</div>
        </div>
      ) : (
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
              {isRecommended && cooling
                ? `too many requests. try again in ${remaining}s.`
                : isFetchingNextPage
                  ? 'loading more...'
                  : 'scroll for more'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Feed Screen ───────────────────────────────────────────────────────────
export function FeedScreen() {
  const { tweaks, viewport } = useLuvaxTweaks();
  const isMobile = viewport === 'mobile';
  const [searchParams, setSearchParams] = useSearchParams();

  // Defaults to "for you": a new account that follows nobody saw an empty
  // Following feed, which is the exact problem this task exists to solve,
  // so the tab landed on first is the one that always has something to
  // show. "following" is the only other valid value; anything else (or no
  // param at all) resolves to "foryou".
  const tab = searchParams.get('tab') === 'following' ? 'following' : 'foryou';

  const selectTab = (id) => {
    const params = new URLSearchParams(searchParams);
    if (id === 'following') params.set('tab', 'following');
    else params.delete('tab');
    // A pushed (not replaced) history entry, so the back button steps
    // between tabs rather than leaving the feed entirely.
    setSearchParams(params);
  };

  const followingQuery = useFeed();
  const forYouQuery = useForYouFeed();

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
            display: 'flex',
            marginBottom: isMobile ? 8 : 16,
            padding: isMobile ? '0 14px' : '0 4px',
          }}
        >
          {[
            { id: 'foryou', label: 'for you' },
            { id: 'following', label: 'following' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              style={{
                flex: 1,
                fontFamily: v.fontBody,
                fontSize: 13,
                fontWeight: 500,
                color: tab === t.id ? v.ink : v.ink3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '13px 0 14px',
                borderBottom: tab === t.id ? '2px solid var(--lx-ink)' : '2px solid transparent',
                letterSpacing: '0.01em',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <FeedTabPanel
          active={tab === 'foryou'}
          isMobile={isMobile}
          betweenPosts={betweenPosts}
          tweaks={tweaks}
          viewport={viewport}
          isRecommended
          query={forYouQuery}
          emptyTitle="nothing to show yet"
          emptySubtitle="check back soon"
        />
        <FeedTabPanel
          active={tab === 'following'}
          isMobile={isMobile}
          betweenPosts={betweenPosts}
          tweaks={tweaks}
          viewport={viewport}
          isRecommended={false}
          query={followingQuery}
          emptyTitle="your feed is quiet"
          emptySubtitle="follow a few people and their posts will appear here"
        />
      </div>
    </div>
  );
}
