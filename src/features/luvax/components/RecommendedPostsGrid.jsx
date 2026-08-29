import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent, getDisplayName, getMediaList, getUserSummary } from '@/utils/helpers';
import { LxAvatar } from './primitives';
import { MediaThumb } from './MediaThumb';
import { useExplore } from '../hooks/usePosts';
import { useOverlayNavigate } from '../hooks/useOverlayNavigate';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';
import { routeTo } from '@/config/constants';

/**
 * One post tile in the discovery grid.
 *
 * Moved out of ExploreScreen.jsx so Explore and Search's pre-query state
 * render the identical markup rather than two copies of the same JSX.
 */
export function SearchResultPost({ post }) {
  const openOverlay = useOverlayNavigate();
  const authorName = getDisplayName(getUserSummary(post), 'Unknown');
  const firstTag = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags[0] : null;

  return (
    <button
      type="button"
      onClick={() => openOverlay(routeTo.postDetail(post.id))}
      style={{
        width: 210,
        background: v.surface,
        border: `1px solid ${v.borderSubtle}`,
        borderRadius: 12,
        padding: '12px 12px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {getMediaList(post).length > 0 ? <MediaThumb post={post} radius={8} /> : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LxAvatar size={20} src={getUserSummary(post).avatarUrl} />
        <span style={{ fontFamily: v.fontBody, fontSize: 12, fontWeight: 500, color: v.ink2 }}>
          {authorName}
        </span>
      </div>
      <div
        style={{
          fontFamily: v.fontBody,
          fontSize: 14,
          lineHeight: 1.45,
          color: v.ink,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 60,
        }}
      >
        {post.caption}
      </div>
      {firstTag ? (
        <div style={{ fontFamily: v.fontBody, fontSize: 12, fontWeight: 600, color: v.accent }}>
          #{firstTag}
        </div>
      ) : null}
    </button>
  );
}

/**
 * The discovery grid: the recommendation feed with follow-exclusion,
 * rendered as the same tile layout Explore's own search results already
 * use. Shared by Explore's non-searching state and Search's pre-query
 * state, both through this one component and this one `useExplore()` call,
 * so there is exactly one call path and one cache entry for this content.
 */
export function RecommendedPostsGrid() {
  const { ref, inView } = useInView();
  const { cooling, remaining, start } = useRateLimitCooldown();
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExplore();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !cooling) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, cooling, fetchNextPage]);

  useEffect(() => {
    if (isError && error?.response?.status === 429) {
      const retryAfter = Number(error.response.headers?.['retry-after']);
      start(retryAfter);
    }
  }, [isError, error, start]);

  const posts = data?.pages?.flatMap((page) => extractPageContent(page)) || [];

  if (isLoading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          fontFamily: v.fontMono,
          fontSize: 12,
          color: v.ink3,
        }}
      >
        loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          fontFamily: v.fontBody,
          fontSize: 14,
          color: v.error,
        }}
      >
        {cooling
          ? `too many requests. try again in ${remaining}s.`
          : (error?.message ?? "we couldn't load this. check your connection and try again.")}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
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
          nothing to show yet
        </div>
        <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink3 }}>
          check back soon, or search for a name, caption, or hashtag
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '18px 16px 28px' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {posts.map((p) => (
          <SearchResultPost key={p.id} post={p} />
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
          {cooling
            ? `too many requests. try again in ${remaining}s.`
            : isFetchingNextPage
              ? 'loading more...'
              : 'scroll for more'}
        </div>
      )}
    </div>
  );
}
