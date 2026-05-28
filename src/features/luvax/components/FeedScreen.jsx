import { useState } from 'react';
import { v } from '../constants/tokens';
import { STORIES, FEED_POSTS } from '../constants/data';
import { LxIcon, LxAvatar, LxTag, LxBtn } from './primitives';

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

// ─── Post Card ─────────────────────────────────────────────────────────────
export function PostCard({ post, navigate, density = 'cozy', showTags = true }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const pad = density === 'dense' ? '10px 12px 12px' : '14px 16px 16px';
  const gap = density === 'dense' ? 8 : 10;

  return (
    <article style={{
      background: v.surface, borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(26,24,22,0.06)',
    }}>
      {post.type === 'image' && (
        <div onClick={() => navigate('post', { post })} style={{
          height: post.media.h, background: post.media.color,
          cursor: 'pointer',
        }} />
      )}
      <div style={{ padding: pad }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: gap }}>
          <LxAvatar size={26} idx={post.idx} />
          <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink, cursor: 'pointer' }}
                onClick={() => navigate('profile', { user: { name: post.author, idx: post.idx } })}>
            {post.author}
          </span>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>·</span>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{post.time}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', padding: 4, color: v.ink3 }}>
            <LxIcon name="more" size={16} color={v.ink3} />
          </button>
        </div>

        <p onClick={() => navigate('post', { post })} style={{
          fontFamily: v.fontBody,
          fontSize: post.type === 'text' ? 16 : 14,
          color: v.ink, lineHeight: 1.5, margin: 0,
          letterSpacing: '-0.01em', cursor: 'pointer',
        }}>{post.text}</p>

        {showTags && post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: gap }}>
            {post.tags.map(t => <LxTag key={t} size="sm">#{t}</LxTag>)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 18, marginTop: gap + 2, alignItems: 'center' }}>
          <button onClick={() => setLiked(l => !l)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <LxIcon name="heart" size={17} color={liked ? v.accent : v.ink3} filled={liked} />
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>{liked ? post.likes + 1 : post.likes}</span>
          </button>
          <button onClick={() => navigate('post', { post })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <LxIcon name="reply" size={17} color={v.ink3} />
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>{Math.floor(post.likes/8)+2}</span>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <LxIcon name="share" size={17} color={v.ink3} />
          </button>
          <button onClick={() => setSaved(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
            <LxIcon name="bookmark" size={17} color={saved ? v.ink : v.ink3} filled={saved} />
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Feed Screen ───────────────────────────────────────────────────────────
export function FeedScreen({ navigate, tweaks, viewport }) {
  const isMulti = viewport === 'tablet' || viewport === 'desktop';
  const gap = tweaks.density === 'dense' ? 8 : 12;

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
            {FEED_POSTS.map(p => (
              <div key={p.id} style={{ breakInside: 'avoid', marginBottom: gap, display: 'inline-block', width: '100%' }}>
                <PostCard post={p} navigate={navigate} density={tweaks.density} showTags={tweaks.showTags} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {FEED_POSTS.map(p => (
              <PostCard key={p.id} post={p} navigate={navigate} density={tweaks.density} showTags={tweaks.showTags} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
