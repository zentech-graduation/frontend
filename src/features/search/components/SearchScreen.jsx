import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';

import { v } from '@/config/tokens';
import { routeTo, CHAR_LIMITS } from '@/config/constants';
import { extractPageContent, getUserSummary, isPageDegraded } from '@/utils/helpers';
import { LxIcon } from '@/features/luvax/components/primitives';
import { UserCard } from '@/features/luvax/components/UserCard';
import { useOverlayNavigate } from '@/features/luvax/hooks/useOverlayNavigate';
import { useViewport } from '@/features/luvax/hooks/useViewport';

import { useHashtagSearch, usePostSearch, useUserSearch } from '../hooks/useSearch';
import { SearchDegraded, SearchEmpty, SearchFailed, SearchLoading, SearchPrompt } from './SearchResultsEmpty';

const TABS = [
  { id: 'posts', label: 'posts' },
  { id: 'people', label: 'people' },
  { id: 'tags', label: 'tags' },
];

/**
 * How long the field waits after the last keystroke before the term reaches the
 * address bar and a request is issued.
 *
 * 300ms sits inside the gap between keystrokes for an average typing cadence,
 * so a word is searched once rather than once per letter, while staying below
 * the point where the pause reads as lag.
 */
const DEBOUNCE_MS = 300;

/**
 * Renders one half of the results, choosing between the four states every
 * surface in this phase is required to have.
 */
function ResultsSection({ query, label, result, renderRows }) {
  const { ref, inView } = useInView();
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = result;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!query) return <SearchPrompt />;
  if (isLoading) return <SearchLoading label={label} />;
  if (isError) return <SearchFailed label={label} />;

  const rows = data?.pages?.flatMap((page) => extractPageContent(page)) || [];
  if (rows.length === 0) {
    // The server distinguishes "nothing matched" from "the search backend is
    // down and this page is not an answer". Reading the flag off any page is
    // enough, because a degraded search returns no rows at all.
    const degraded = (data?.pages || []).some((page) => isPageDegraded(page));
    return degraded ? <SearchDegraded label={label} /> : <SearchEmpty label={label} query={query} />;
  }

  return (
    <>
      {renderRows(rows)}
      {/* Infinite scroll trigger. Each half owns its own, so one running out of
          pages does not stop the others. */}
      <div ref={ref} style={{ height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {isFetchingNextPage && <span style={{ color: v.ink3, fontSize: 12, fontFamily: v.fontBody }}>loading more...</span>}
      </div>
    </>
  );
}

export function SearchScreen() {
  const navigate = useNavigate();
  const openOverlay = useOverlayNavigate();
  const viewport = useViewport();
  const cols = viewport === 'desktop' ? 3 : 2;

  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const tab = searchParams.get('type') || 'posts';

  const [input, setInput] = useState(searchParams.get('q') || '');

  // The address is the source of truth for what was searched, so a search can
  // be shared and survives a reload. Typing writes to it on a delay, and
  // replaces rather than pushes so back leaves the search instead of walking
  // through every prefix that was typed on the way to it.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = input.trim();
      if (next === query) return;
      const params = new URLSearchParams(searchParams);
      if (next) params.set('q', next);
      else params.delete('q');
      setSearchParams(params, { replace: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, query, searchParams, setSearchParams]);

  // An address opened cold or edited by hand is authoritative over the field.
  useEffect(() => {
    setInput((current) => (current.trim() === query ? current : query));
  }, [query]);

  const selectTab = (id) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', id);
    setSearchParams(params, { replace: true });
  };

  const postResult = usePostSearch(query);
  const userResult = useUserSearch(query);
  const hashtagResult = useHashtagSearch(query);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: v.base }}>
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${v.border}`,
          background: v.surface,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <form
          onSubmit={(event) => event.preventDefault()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 38,
            padding: '0 14px',
            border: `1px solid ${v.borderSubtle}`,
            borderRadius: 999,
            background: v.base,
          }}
        >
          <LxIcon name="explore" size={15} color={v.ink3} />
          <input
            type="search"
            value={input}
            maxLength={CHAR_LIMITS.search}
            autoFocus
            aria-label="search posts, people, and tags"
            placeholder="search"
            onChange={(event) => setInput(event.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: v.ink,
              fontFamily: v.fontBody,
              fontSize: 14,
            }}
          />
        </form>

        <div style={{ display: 'flex', marginTop: 14, marginBottom: -17 }}>
          {TABS.map((t) => (
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
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'posts' && (
          <ResultsSection
            query={query}
            label="posts"
            result={postResult}
            renderRows={(rows) => (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, padding: '2px 0 0' }}>
                {rows.map((post) => {
                  const mediaUrl = post.media && post.media.length > 0 ? post.media[0].cdnUrl : null;
                  return (
                    <div
                      key={post.id}
                      onClick={() => openOverlay(routeTo.postDetail(post.id))}
                      style={{
                        background: mediaUrl
                          ? `url(${mediaUrl}) center/cover no-repeat`
                          : 'color-mix(in srgb, var(--lx-surface-raised) 82%, #d8d1c4 18%)',
                        aspectRatio: '1/1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 10,
                        boxSizing: 'border-box',
                      }}
                    >
                      {!mediaUrl && post.caption && (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: v.fontBody,
                            color: v.ink3,
                            textAlign: 'center',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {post.caption}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          />
        )}

        {tab === 'people' && (
          <ResultsSection
            query={query}
            label="people"
            result={userResult}
            renderRows={(rows) => (
              <div style={{ padding: '4px 16px' }}>
                {rows.map((item) => {
                  // Rows are UserListItemResponse: the account nests under `user`
                  // and the relationship travels alongside it, so the follow
                  // control starts in the state the server reports rather than
                  // always reading "follow".
                  const rowUser = getUserSummary(item, 'user');
                  return (
                    <UserCard
                      key={rowUser.id}
                      user={rowUser}
                      initiallyFollowing={item.viewerState?.isFollowing ?? false}
                      initiallyRequested={item.viewerState?.isFollowRequested ?? false}
                      onAvatarClick={(u) => navigate(routeTo.userProfile(u.id))}
                    />
                  );
                })}
              </div>
            )}
          />
        )}

        {tab === 'tags' && (
          <ResultsSection
            query={query}
            label="tags"
            result={hashtagResult}
            renderRows={(rows) => (
              <div style={{ padding: '4px 0' }}>
                {rows.map((tag) => (
                  <div
                    key={tag.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: `1px solid ${v.borderSubtle}`,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: v.surfaceRaised,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <LxIcon name="hash" size={18} color={v.ink2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>
                        #{tag.name}
                      </div>
                      <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, marginTop: 2 }}>
                        {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
