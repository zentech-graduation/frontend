import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { TOPICS } from '../constants/data';
import { LxIcon, LxAvatar, LxTag } from './primitives';
import { useExplore } from '../hooks/usePosts';

const SEARCH_BIOS = {
  'mara.v': 'light, shadow, and the space between',
  'sol.r': 'morning, window, coffee',
  'jo.x': 'reading slowly in 2026',
  'ren.ko': 'design, restraint',
  'noa.b': 'before sunrise, always watching',
  'lea.p': 'film grain, city silence',
};

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

function SearchResultPerson({ user, navigate }) {
  return (
    <button
      type="button"
      onClick={() => navigate('profile', { user })}
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
        <LxAvatar size={40} src={user.avatarUrl || null} idx={user.idx || 0} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 700, color: v.ink, lineHeight: 1.2 }}>
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
            {SEARCH_BIOS[user.username] || 'quiet notes, passing thoughts'}
          </div>
        </div>
      </div>
      <span style={{ color: v.ink3, display: 'inline-flex', alignItems: 'center' }}>
        <LxIcon name="chevronRight" size={14} color={v.ink3} />
      </span>
    </button>
  );
}

function SearchResultPost({ post, navigate }) {
  const authorName = post.username || post.author || 'Unknown';
  const firstTag = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags[0] : null;

  return (
    <button
      type="button"
      onClick={() => navigate('post', { postId: post.id })}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LxAvatar size={20} src={post.userAvatarUrl || null} idx={post.idx || 0} />
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
        {post.caption || post.text}
      </div>
      {firstTag ? (
        <div style={{ fontFamily: v.fontBody, fontSize: 12, fontWeight: 600, color: v.accent }}>
          #{firstTag}
        </div>
      ) : null}
    </button>
  );
}

export function ExploreScreen({ navigate, viewport, params = {} }) {
  const [query, setQuery] = useState(params?.q || '');
  const [activeTopic, setActiveTopic] = useState(null);
  const searchInputRef = useRef(null);

  const { ref, inView } = useInView();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useExplore({ q: query });

  useEffect(() => {
    setQuery(params?.q || '');
  }, [params?.q]);

  useEffect(() => {
    if (params?.focusSearch) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [params?.focusSearch, params?.q]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages?.flatMap(page => extractPageContent(page)) || [];
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const suggestionChips = TOPICS.slice(0, 8);
  const people = posts
    .reduce((acc, post) => {
      const username = post.username || post.author;
      if (!username || acc.some(user => user.username === username)) return acc;
      acc.push({
        id: post.userId || username,
        username,
        displayName: username,
        avatarUrl: post.userAvatarUrl || null,
        idx: post.idx || 0,
      });
      return acc;
    }, [])
    .slice(0, 1);
  const foundCount = people.length + posts.length;

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
            ref={searchInputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="search posts, people, hashtags..."
            style={{
              width: '100%', fontFamily: v.fontBody, fontSize: 15, color: v.ink,
              background: v.surfaceSunken, border: `1px solid ${v.border}`,
              borderRadius: 999, padding: '10px 42px 10px 34px',
              outline: 'none', boxSizing: 'border-box',
            }} />
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
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, padding: isSearching ? '12px 16px 0' : '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {suggestionChips.map(t => (
            <LxTag key={t} active={activeTopic === t} onClick={() => setActiveTopic(activeTopic === t ? null : t)}>
              #{t}
            </LxTag>
          ))}
        </div>

        {isSearching ? (
          <div style={{ padding: '18px 16px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: v.fontDisplay, fontSize: 22, lineHeight: 1, letterSpacing: '-0.035em', color: v.ink }}>
                  results
                </span>
                <span style={{ fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
                  for “{trimmedQuery}”
                </span>
              </div>
              <span style={{ fontFamily: v.fontMono, fontSize: 12, color: v.ink3, whiteSpace: 'nowrap' }}>
                {foundCount} found
              </span>
            </div>

            {people.length > 0 ? (
              <>
                <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 14, marginBottom: 14 }}>
                  people
                </div>
                <SearchResultPerson user={people[0]} navigate={navigate} />
              </>
            ) : null}

            <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 26, marginBottom: 14 }}>
              posts
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {posts.map((p, i) => <SearchResultPost key={p.id || i} post={p} navigate={navigate} />)}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 16px 12px' }}>
              trending today
            </div>

            <div style={{ padding: '0 16px 24px', columnCount: cols, columnGap: 8 }}>
              {posts.map((p, i) => <MiniCard key={p.id || i} p={p} navigate={navigate} />)}
            </div>
          </>
        )}

        {!isSearching && hasNextPage && (
          <div ref={ref} style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
            {isFetchingNextPage ? 'loading more...' : 'scroll for more'}
          </div>
        )}
      </div>
    </>
  );
}
