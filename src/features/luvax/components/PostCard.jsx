import { useState } from 'react';
import { v } from '../constants/tokens';
import { LxIcon, LxAvatar, LxTag, LxBottomSheet, LxBtn } from './primitives';
import { useUpdatePostStatus, useUpdatePost, useDeletePost } from '../hooks/usePosts';

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

export function PostCard({ post, navigate, density = 'cozy', showTags = true }) {
  // Use interaction counts from the backend if available, fallback to 0
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const handleEditOpen = () => {
    setMenuOpen(false);
    setEditCaption(post.caption || post.text || '');
    setEditSheetOpen(true);
  };

  const handleEditSubmit = () => {
    if (editCaption.trim() !== '') {
      updatePost.mutate({ postId: post.id, data: { caption: editCaption } });
      setEditSheetOpen(false);
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate(post.id);
    }
  };
  
  const pad = density === 'dense' ? '10px 12px 12px' : '14px 16px 16px';
  const gap = density === 'dense' ? 8 : 10;
  
  const authorName = post.username || post.author || 'Unknown';
  const avatarUrl = post.userAvatarUrl;
  const timeStr = timeAgo(post.createdAt || post.time);
  
  // Hashtags in caption can be highlighted later, for now we just show them if they exist in the mock 'tags' array or parsed from caption
  const tags = post.tags || (post.caption ? (post.caption.match(/#(\w+)/g) || []).map(t => t.slice(1)) : []);
  
  const media = post.media && post.media.length > 0 ? post.media[0] : null;

  return (
    <article style={{
      background: v.surface, borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(26,24,22,0.06)',
    }}>
      {/* Media Renderer */}
      {media && media.cdnUrl && (
        <div 
          onClick={() => navigate('post', { postId: post.id })} 
          style={{ cursor: 'pointer', position: 'relative', width: '100%' }}
        >
          {media.mediaType === 'VIDEO' ? (
             <video src={media.cdnUrl} style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 500 }} controls muted />
          ) : (
             <img src={media.cdnUrl} alt={media.altText || 'Post image'} style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 500 }} />
          )}
        </div>
      )}
      {/* Fallback for mock data (before real backend connects) */}
      {!media && post.type === 'image' && post.media && (
        <div onClick={() => navigate('post', { postId: post.id })} style={{
          height: post.media.h, background: post.media.color,
          cursor: 'pointer',
        }} />
      )}

      <div style={{ padding: pad }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: gap }}>
          <div 
            onClick={() => navigate('profile', { user: { id: post.userId || post.authorId, username: post.username, displayName: authorName, avatarUrl: post.userAvatarUrl, idx: post.idx || 0 } })}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <LxAvatar size={26} idx={post.idx || 0} src={avatarUrl} />
            <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink }}>
              {authorName}
            </span>
          </div>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>·</span>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{timeStr}</span>
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
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

        {/* Caption */}
        <p onClick={() => navigate('post', { postId: post.id })} style={{
          fontFamily: v.fontBody,
          fontSize: (post.postType === 'TEXT' || post.type === 'text') ? 16 : 14,
          color: v.ink, lineHeight: 1.5, margin: 0,
          letterSpacing: '-0.01em', cursor: 'pointer',
          whiteSpace: 'pre-wrap',
        }}>{post.caption || post.text}</p>

        {/* Tags */}
        {showTags && tags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: gap }}>
            {tags.map((t, idx) => <LxTag key={idx} size="sm">#{t}</LxTag>)}
          </div>
        )}

        {/* Interactions */}
        <div style={{ display: 'flex', gap: 18, marginTop: gap + 2, alignItems: 'center' }}>
          <button onClick={() => setLiked(l => !l)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <LxIcon name="heart" size={17} color={liked ? v.accent : v.ink3} filled={liked} />
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
              {liked ? (post.likeCount || post.likes || 0) + 1 : (post.likeCount || post.likes || 0)}
            </span>
          </button>
          <button onClick={() => navigate('post', { postId: post.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <LxIcon name="reply" size={17} color={v.ink3} />
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
              {post.commentCount || Math.floor((post.likes || 0)/8)+2}
            </span>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <LxIcon name="share" size={17} color={v.ink3} />
          </button>
          <button onClick={() => setSaved(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
            <LxIcon name="bookmark" size={17} color={saved ? v.ink : v.ink3} filled={saved} />
          </button>
        </div>
      </div>

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
    </article>
  );
}
