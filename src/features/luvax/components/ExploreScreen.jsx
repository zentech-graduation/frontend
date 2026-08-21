import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent, getDisplayName, getMediaList, getUserSummary } from '@/utils/helpers';
import { LxIcon, LxAvatar, LxTag } from './primitives';
import { MediaThumb } from './MediaThumb';
import { useExplore } from '../hooks/usePosts';
import { useOverlayNavigate } from '../hooks/useOverlayNavigate';
import { useLuvaxTweaks } from '../LuvaxTweaksContext';
import { routeTo } from '@/config/constants';

function MiniCard({ p }) {
  const navigate = useNavigate();
  const openOverlay = useOverlayNavigate();
  const author = getUserSummary(p);
  const authorName = getDisplayName(author, 'Unknown');
  const avatarUrl = author.avatarUrl;
  return (
    <div
      onClick={() => openOverlay(routeTo.postDetail(p.id))}
      style={{
        background: v.surface,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        breakInside: 'avoid',
        marginBottom: 8,
        display: 'inline-block',
        width: '100%',
      }}
    >
      {/* The card clips its own corners, so the tile needs no radius of its own. */}
      {getMediaList(p).length > 0 ? <MediaThumb post={p} radius={0} /> : null}
      <div style={{ padding: '10px 12px 12px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}
          onClick={(e) => {
            e.stopPropagation();
            if (author.id) navigate(routeTo.userProfile(author.id));
          }}
        >
          <LxAvatar size={18} src={avatarUrl} />
          <span
            style={{
              fontFamily: v.fontBody,
              fontSize: 11,
              fontWeight: 500,
              color: v.ink2,
              cursor: 'pointer',
            }}
          >
            {authorName}
          </span>
        </div>
        <p
          style={{
            fontFamily: v.fontBody,
            fontSize: 12,
            color: v.ink,
            lineHeight: 1.5,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {p.caption}
        </p>
      </div>
    </div>
  );
}

function SearchResultPerson({ user }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => user?.id && navigate(routeTo.userProfile(user.id))}
      style={{
        width: '100%',
        background: 'none',
        border: 'none',
        padding: '0 2px 0 4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <LxAvatar size={40} src={user.avatarUrl} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: v.fontBody,
              fontSize: 14,
              fontWeight: 700,
              color: v.ink,
              lineHeight: 1.2,
            }}
          >
            {user.displayName || user.username}
          </div>
          <div
            style={{
              marginTop: 3,
              fontFamily: v.fontBody,
              fontSize: 13,
              color: v.ink3,
              lineHeight: 1.35,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.bio || ''}
          </div>
        </div>
      </div>
      <span style={{ color: v.ink3, display: 'inline-flex', alignItems: 'center' }}>
        <LxIcon name="chevronRight" size={14} color={v.ink3} />
      </span>
    </button>
  );
}

function SearchResultPost({ post }) {
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
      {/* Radius 8 is derived: one step in from the card's own 12, since the tile
          sits inside the card's 12px padding rather than against its edge. */}
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

export function ExploreScreen() {
  // The search terms live in the address, so an explore search can be shared
  // and survives a reload.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeQuery = searchParams.get('q') || '';
  const shouldFocusSearch = searchParams.get('focusSearch') === '1';
  const { viewport } = useLuvaxTweaks();
  const [query, setQuery] = useState(activeQuery);
  const searchInputRef = useRef(null);

  const { ref, inView } = useInView();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useExplore({ q: query });

  // Adjusted during render, not in an effect: the field is user-editable so it cannot be derived,
  // but resetting it from an effect rendered the screen twice on every address change.
  const [lastActiveQuery, setLastActiveQuery] = useState(activeQuery);
  if (activeQuery !== lastActiveQuery) {
    setLastActiveQuery(activeQuery);
    setQuery(activeQuery);
  }

  useEffect(() => {
    if (shouldFocusSearch) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [shouldFocusSearch, activeQuery]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages?.flatMap((page) => extractPageContent(page)) || [];
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  // Every distinct author among the matches, not just the first. The prior
  // slice(0, 1) showed one person however many matched.
  const people = posts.reduce((acc, post) => {
    const author = getUserSummary(post);
    if (!author.id || acc.some((user) => user.id === author.id)) return acc;
    acc.push({
      id: author.id,
      username: author.username,
      displayName: getDisplayName(author),
      avatarUrl: author.avatarUrl,
    });
    return acc;
  }, []);
  const foundCount = people.length + posts.length;

  // Enter commits the query to the address so a search can be shared and
  // survives a reload, which a bare input could not do.
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const next = query.trim();
    setSearchParams(next ? { q: next } : {});
    searchInputRef.current?.blur();
  };

  const cols = viewport === 'desktop' ? 3 : 2;

  return (
    <>
      <div
        style={{
          padding: '12px 16px 14px',
          background: v.base,
          borderBottom: `1px solid ${v.border}`,
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <div
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          >
            <LxIcon name="explore" size={15} color={v.ink3} />
          </div>
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search posts, people, hashtags..."
            style={{
              width: '100%',
              fontFamily: v.fontBody,
              fontSize: 15,
              color: v.ink,
              background: v.surfaceSunken,
              border: `1px solid ${v.border}`,
              borderRadius: 999,
              padding: '10px 42px 10px 34px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {query.trim() ? (
            <button
              type="button"
              aria-label="clear search"
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                background: v.surfaceRaised,
                color: v.ink3,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <LxIcon name="close" size={12} color={v.ink3} />
            </button>
          ) : null}
        </form>
      </div>

      {/* The topic chips that used to sit here were a hardcoded list of invented
          topics. There is no endpoint behind them, and a chip that filters
          nothing is a control that lies about what it does. Hashtag search is
          the real way to reach a tag. The activeTopic state that drove them was
          removed with this phase, since nothing wrote a real value and nothing
          read it. */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isSearching ? (
          <div style={{ padding: '18px 16px 28px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: v.fontDisplay,
                    fontSize: 22,
                    lineHeight: 1,
                    letterSpacing: '-0.035em',
                    color: v.ink,
                  }}
                >
                  results
                </span>
                <span style={{ fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
                  for “{trimmedQuery}”
                </span>
              </div>
              <span
                style={{
                  fontFamily: v.fontMono,
                  fontSize: 12,
                  color: v.ink3,
                  whiteSpace: 'nowrap',
                }}
              >
                {foundCount} found
              </span>
            </div>

            {foundCount === 0 ? (
              // Search empty state, on the design's own empty-state geometry.
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
                  nothing matched “{trimmedQuery}”
                </div>
                <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink3 }}>
                  try a different name, caption, or hashtag
                </div>
              </div>
            ) : (
              <>
                {people.length > 0 ? (
                  <>
                    <div
                      style={{
                        fontFamily: v.fontMono,
                        fontSize: 10,
                        color: v.ink3,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        marginTop: 14,
                        marginBottom: 14,
                      }}
                    >
                      people
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {people.map((person) => (
                        <SearchResultPerson key={person.id} user={person} />
                      ))}
                    </div>
                  </>
                ) : null}

                {posts.length > 0 ? (
                  <>
                    <div
                      style={{
                        fontFamily: v.fontMono,
                        fontSize: 10,
                        color: v.ink3,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        marginTop: 26,
                        marginBottom: 14,
                      }}
                    >
                      posts
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {posts.map((p, i) => (
                        <SearchResultPost key={p.id || i} post={p} />
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
        ) : (
          // Trending is ranked by the recommendation module, which is still being
          // built, so there is no real ranking to show. Rather than fabricate one
          // from a fallback search, this states plainly that trending is not ready
          // without claiming the feature is broken. See docs/layout-overhaul.
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: v.fontMono,
                fontSize: 10,
                color: v.ink3,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              trending today
            </div>
            <div
              style={{
                fontFamily: v.fontBody,
                fontSize: 15,
                fontWeight: 500,
                color: v.ink2,
                marginBottom: 4,
              }}
            >
              trending is still warming up
            </div>
            <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink3 }}>
              search for a name, caption, or hashtag to explore
            </div>
          </div>
        )}
      </div>
    </>
  );
}
