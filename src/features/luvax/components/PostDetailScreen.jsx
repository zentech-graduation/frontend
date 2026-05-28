import { useState } from 'react';
import { v } from '../constants/tokens';
import { REPLIES } from '../constants/data';
import { LxIcon, LxAvatar, LxTag, LxBtn, LxBottomSheet } from './primitives';

// ─── Comment Row ───────────────────────────────────────────────────────────
function CommentRow({ r }) {
  const [liked, setLiked] = useState(false);
  return (
    <div style={{ padding: '12px 16px', display: 'flex', gap: 10 }}>
      <LxAvatar size={32} idx={r.idx} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink }}>{r.author}</span>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{r.time}</span>
        </div>
        <p style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink, lineHeight: 1.5, margin: 0 }}>{r.text}</p>
        <div style={{ display: 'flex', gap: 14, marginTop: 6, alignItems: 'center' }}>
          <button onClick={() => setLiked(l => !l)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: v.fontMono, fontSize: 10, color: v.ink3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <LxIcon name="heart" size={12} color={liked ? v.accent : v.ink3} filled={liked} />
            {liked ? r.likes + 1 : r.likes}
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: v.fontBody, fontSize: 11, fontWeight: 500, color: v.ink3 }}>reply</button>
        </div>
      </div>
    </div>
  );
}

// ─── Comments Sheet ────────────────────────────────────────────────────────
function CommentsSheet({ open, onClose }) {
  const [text, setText] = useState('');
  return (
    <LxBottomSheet open={open} onClose={onClose} height="75vh">
      <div style={{ padding: '4px 16px 8px', borderBottom: `1px solid ${v.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink }}>comments</div>
        <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>{REPLIES.length}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {REPLIES.map((r, i) => (
          <div key={r.author}>
            <CommentRow r={r} />
            {i < REPLIES.length - 1 && <div style={{ height: 1, background: v.borderSubtle, marginLeft: 58 }} />}
          </div>
        ))}
      </div>

      <div style={{
        padding: '10px 12px 16px',
        borderTop: `1px solid ${v.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
        background: v.base,
      }}>
        <LxAvatar size={28} idx={0} />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="add a comment..."
          style={{
            flex: 1, fontFamily: v.fontBody, fontSize: 14, color: v.ink,
            background: v.surfaceSunken, border: `1px solid ${v.border}`,
            borderRadius: 999, padding: '9px 14px', outline: 'none',
          }} />
        <button disabled={!text.trim()} style={{
          background: 'none', border: 'none',
          cursor: text.trim() ? 'pointer' : 'default',
          padding: 4, opacity: text.trim() ? 1 : 0.4,
        }}>
          <LxIcon name="send" size={20} color={v.accent} />
        </button>
      </div>
    </LxBottomSheet>
  );
}

// ─── Post Detail Screen ────────────────────────────────────────────────────
export function PostDetailScreen({ navigate, params = {} }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const post = params.post || {
    idx: 0, author: 'mara.v', time: '14m',
    text: 'light is the medium, not the message.',
    tags: ['observation', 'light'], type: 'text', likes: 48,
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {post.type === 'image' && post.media && (
          <div style={{ height: 360, background: post.media.color }} />
        )}

        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <LxAvatar size={42} idx={post.idx} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>{post.author}</div>
              <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 1 }}>{post.time} ago</div>
            </div>
            <LxBtn variant="primary" size="sm">follow</LxBtn>
          </div>

          <p style={{
            fontFamily: v.fontBody,
            fontSize: post.type === 'text' ? 22 : 16,
            fontWeight: 400, color: v.ink,
            lineHeight: post.type === 'text' ? 1.4 : 1.55, margin: 0,
            letterSpacing: '-0.02em',
          }}>{post.text}</p>

          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 14 }}>
              {post.tags.map(t => <LxTag key={t}>#{t}</LxTag>)}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
            <span>{liked ? post.likes + 1 : post.likes} likes · {REPLIES.length} replies</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <LxIcon name="eye" size={12} color={v.ink3} />
              {Math.floor(post.likes * 18)}
            </span>
          </div>

          {/* Reaction bar */}
          <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${v.border}`, alignItems: 'center' }}>
            <button onClick={() => setLiked(l => !l)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <LxIcon name="heart" size={22} color={liked ? v.accent : v.ink} filled={liked} />
              <span style={{ fontFamily: v.fontBody, fontSize: 13, color: liked ? v.accent : v.ink, fontWeight: 500 }}>like</span>
            </button>
            <button onClick={() => setCommentsOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <LxIcon name="reply" size={22} color={v.ink} />
              <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink, fontWeight: 500 }}>reply</span>
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <LxIcon name="share" size={22} color={v.ink} />
            </button>
            <button onClick={() => setSaved(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
              <LxIcon name="bookmark" size={22} color={v.ink} filled={saved} />
            </button>
          </div>
        </div>

        {/* Preview of replies (top 2) */}
        <div style={{ borderTop: `8px solid ${v.surfaceSunken}` }}>
          <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{REPLIES.length} replies</span>
            <button onClick={() => setCommentsOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: v.fontBody, fontSize: 12, fontWeight: 500, color: v.accentText }}>view all</button>
          </div>
          {REPLIES.slice(0, 2).map(r => <CommentRow key={r.author} r={r} />)}
          <button onClick={() => setCommentsOpen(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 16px 20px', fontFamily: v.fontBody, fontSize: 13, fontWeight: 500,
            color: v.ink2, textAlign: 'left', width: '100%',
          }}>
            view {REPLIES.length - 2} more replies →
          </button>
        </div>
      </div>

      <CommentsSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </>
  );
}
