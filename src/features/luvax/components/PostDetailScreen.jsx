import { useState } from 'react';
import { v } from '../constants/tokens';
import { REPLIES } from '../constants/data';
import { LxIcon, LxAvatar, LxTag, LxBtn, LxBottomSheet } from './primitives';
import { usePostDetail, useUpdatePost, useDeletePost } from '../hooks/usePosts';

// Simple time ago formatter
const timeAgo = (dateStr) => {
  if (!dateStr) return 'now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

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
        <div style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
          No comments yet
        </div>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  
  const postId = params.postId;
  const { data: postResponse, isLoading, isError } = usePostDetail(postId);
  
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const handleEditOpen = () => {
    setMenuOpen(false);
    const post = postResponse?.data || postResponse;
    setEditCaption(post?.caption || post?.text || '');
    setEditSheetOpen(true);
  };

  const handleEditSubmit = () => {
    if (editCaption.trim() !== '') {
      updatePost.mutate({ postId, data: { caption: editCaption } });
      setEditSheetOpen(false);
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate(postId, {
        onSuccess: () => navigate(-1) // go back after delete
      });
    }
  };
  
  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.ink3 }}>
        loading post...
      </div>
    );
  }

  if (isError || !postResponse) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.error }}>
        Post not found
      </div>
    );
  }

  const post = postResponse.data || postResponse;
  
  const authorName = post.username || post.author || 'Unknown';
  const authorAvatarUrl = post.userAvatarUrl || null;
  const timeStr = timeAgo(post.createdAt || post.time);
  const tags = post.tags || (post.caption ? (post.caption.match(/#(\w+)/g) || []).map(t => t.slice(1)) : []);
  const mediaList = post.media || [];
  const mainMediaUrl = mediaList.length > 0 ? mediaList[0].cdnUrl : null;
  const mainMediaType = mediaList.length > 0 ? mediaList[0].mediaType : null;
  const likeCount = post.likeCount || post.likes || 0;
  const commentCount = post.commentCount || 0;

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {mainMediaUrl && mainMediaType !== 'VIDEO' && (
          <div style={{ height: 360, background: `url(${mainMediaUrl}) center/cover no-repeat` }} />
        )}
        {mainMediaUrl && mainMediaType === 'VIDEO' && (
          <div style={{ height: 360, background: v.surfaceRaised }}>
            <video src={mainMediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls autoPlay muted loop playsInline />
          </div>
        )}

        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            {authorAvatarUrl ? (
              <img src={authorAvatarUrl} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
            ) : (
              <LxAvatar size={42} idx={post.idx || 0} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>{authorName}</div>
              <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 1 }}>{timeStr}</div>
            </div>
            <LxBtn variant="primary" size="sm">follow</LxBtn>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: v.ink3 }}>
                <LxIcon name="more" size={16} color={v.ink3} />
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 24, right: 0, background: v.surfaceRaised, border: `1px solid ${v.border}`,
                  borderRadius: 8, padding: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100, zIndex: 10
                }}>
                  <button onClick={handleEditOpen} style={{ background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: v.fontBody, fontSize: 13, color: v.ink }}>Edit Post</button>
                  <button onClick={handleDelete} style={{ background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: v.fontBody, fontSize: 13, color: v.error }}>Delete Post</button>
                </div>
              )}
            </div>
          </div>

          <p style={{
            fontFamily: v.fontBody,
            fontSize: post.postType === 'TEXT' || post.type === 'text' ? 22 : 16,
            fontWeight: 400, color: v.ink,
            lineHeight: post.postType === 'TEXT' || post.type === 'text' ? 1.4 : 1.55, margin: 0,
            letterSpacing: '-0.02em',
            whiteSpace: 'pre-wrap',
          }}>{post.caption || post.text}</p>

          {tags && tags.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 14 }}>
              {tags.map(t => <LxTag key={t}>#{t}</LxTag>)}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
            <span>{liked ? likeCount + 1 : likeCount} likes · {commentCount} replies</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <LxIcon name="eye" size={12} color={v.ink3} />
              {post.viewCount || Math.floor(likeCount * 18)}
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

        {/* Preview of replies */}
        <div style={{ borderTop: `8px solid ${v.surfaceSunken}` }}>
          <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{commentCount} replies</span>
          </div>
          <div style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
            No comments yet
          </div>
        </div>
      </div>

      <CommentsSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} />

      <LxBottomSheet open={editSheetOpen} onClose={() => setEditSheetOpen(false)} height="40vh">
        <div style={{ padding: '4px 16px 8px', borderBottom: `1px solid ${v.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink }}>Edit Post</div>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Write a caption..."
            style={{
              width: '100%', height: 100, fontFamily: v.fontBody, fontSize: 15, color: v.ink,
              border: `1px solid ${v.border}`, borderRadius: 8, padding: 12, resize: 'none', outline: 'none'
            }}
          />
          <LxBtn variant="primary" onClick={handleEditSubmit}>Save Changes</LxBtn>
        </div>
      </LxBottomSheet>
    </>
  );
}
