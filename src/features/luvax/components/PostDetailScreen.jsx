import { useEffect, useMemo, useRef, useState } from 'react';
import { v } from '../constants/tokens';
import { REPLIES } from '../constants/data';
import { LxAvatar, LxBtn, LxDropdownMenu, LxIcon, LxModal, LxTag } from './primitives';
import { useDeletePost, usePostDetail, useUpdatePost } from '../hooks/usePosts';
import { useAuthStore } from '@/store/useAuthStore';
import { useBlock, useFollow, useFollowing, useUnfollow } from '../hooks/useSocial';
import { useRelativeTime } from '../hooks/useRelativeTime';

const HEART_COLOR = 'var(--lx-error)';

const buildThreadReplies = (authorName) => {
  const baseReplies = REPLIES.map((reply) => ({ ...reply, id: `${reply.author}-${reply.time}`, children: [] }));
  if (baseReplies[0]) {
    baseReplies[0].children = [
      {
        id: `${baseReplies[0].author}-child-1`,
        idx: 2,
        author: 'jo.x',
        time: '6m',
        text: 'exactly what i was thinking',
        likes: 2,
        children: [
          {
            id: `${baseReplies[0].author}-child-1-nested-1`,
            idx: 0,
            author: 'mara.v',
            time: '4m',
            text: 'glad it resonated',
            likes: 1,
          },
        ],
      },
    ];
  }
  if (baseReplies[2]) {
    baseReplies[2].children = [
      { id: `${baseReplies[2].author}-child-1`, idx: 0, author: authorName || 'author', time: '34m', text: 'that is the better way to say it.', likes: 2 },
    ];
  }
  if (baseReplies[3] && authorName === 'mara.v') {
    baseReplies[3] = {
      ...baseReplies[3],
      author: 'mara.v',
      idx: 0,
      time: '2h',
      text: 'appreciate everyone reading closely',
      likes: 6,
      children: [],
    };
  }
  return baseReplies.slice(0, authorName === 'mara.v' ? 5 : 5);
};

const buildDefaultExpandedReplyIds = () => new Set();

const findReplyPath = (replies, targetId, trail = []) => {
  for (const reply of replies) {
    const nextTrail = [...trail, reply.id];
    if (reply.id === targetId) return nextTrail;
    if (reply.children?.length) {
      const childPath = findReplyPath(reply.children, targetId, nextTrail);
      if (childPath) return childPath;
    }
  }
  return null;
};

const appendReplyToTree = (replies, targetId, nextReply) =>
  replies.map((reply) => {
    if (reply.id === targetId) {
      return {
        ...reply,
        children: [...(reply.children || []), nextReply],
      };
    }
    if (!reply.children?.length) return reply;
    return {
      ...reply,
      children: appendReplyToTree(reply.children, targetId, nextReply),
    };
  });

const buildPostLink = (postId) => {
  if (typeof window === 'undefined') return `luvax://post/${postId}`;
  return `${window.location.origin}${window.location.pathname}#post-${postId}`;
};

const copyPostLink = async (postId) => {
  const link = buildPostLink(postId);
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
    return;
  }
  window.prompt('copy link', link);
};

const sharePost = async (postId, title) => {
  const link = buildPostLink(postId);
  if (navigator?.share) {
    await navigator.share({ title: title || 'luvax post', url: link });
    return;
  }
  await copyPostLink(postId);
};

function CommentRow({ reply, onReply, indent = 0, expandedReplyIds, onToggleReplies, navigate, postId, authorProfile }) {
  const [liked, setLiked] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [commentMenuOpen, setCommentMenuOpen] = useState(false);
  const childReplies = reply.children || [];
  const hasNestedReplies = childReplies.length > 0;
  const showReplies = expandedReplyIds.has(reply.id);
  const isNestedReply = indent > 0;
  const nestedDepth = isNestedReply ? Math.round(indent / 30) : 0;
  const nestedOffset = isNestedReply ? 23 + Math.max(0, nestedDepth - 1) * 23 : 0;
  const nestedRepliesLift = Math.min(14, 8 + nestedDepth * 2);
  const commentMenuButtonRef = useRef(null);
  const handleLikeToggle = () => {
    setHeartBurst(false);
    window.requestAnimationFrame(() => setHeartBurst(true));
    setLiked((value) => {
      const next = !value;
      return next;
    });
  };
  const commentMenuItems = [
    { id: 'like', icon: 'heart', label: liked ? 'Unlike' : 'Like', onClick: handleLikeToggle },
    { id: 'share', icon: 'share', label: 'Share', onClick: () => sharePost(postId, reply.text) },
    { id: 'copy', icon: 'link', label: 'Copy link', onClick: () => copyPostLink(postId) },
    {
      id: 'view-profile',
      icon: 'profile',
      label: "View author's profile",
      onClick: () => authorProfile ? navigate?.('profile', { user: authorProfile }) : null,
    },
    { id: 'report', icon: 'flag', label: 'Report', tone: 'danger', separator: true, onClick: () => {} },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '40px minmax(0, 1fr)',
        gap: 12,
        padding: isNestedReply ? '6px 28px 8px 0' : '14px 28px 13px 0',
        borderBottom: hasNestedReplies ? 'none' : `1px solid ${v.borderSubtle}`,
      }}
      >
        <div style={{ marginLeft: indent + nestedOffset }}>
          <LxAvatar size={34} idx={reply.idx} />
        </div>
        <div style={{ minWidth: 0, marginLeft: indent + nestedOffset }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap', lineHeight: 1.42 }}>
            <span style={{ fontFamily: v.fontBody, fontSize: 12.5, fontWeight: 600, color: v.ink }}>{reply.author}</span>
            <span style={{ fontFamily: v.fontBody, fontSize: 12.5, color: v.ink }}>{reply.text}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>
            <span>{reply.time}</span>
            <span>{liked ? reply.likes + 1 : reply.likes} likes</span>
            <button type="button" onClick={() => onReply(reply)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: v.ink3, fontFamily: v.fontBody, fontSize: 11.5, fontWeight: 500 }}>
              Reply
            </button>
            {hovered || commentMenuOpen ? (
              <button
                ref={commentMenuButtonRef}
                type="button"
                onClick={() => setCommentMenuOpen((open) => !open)}
                style={{ background: 'none', border: 'none', padding: 0, marginTop: -5, cursor: 'pointer', color: v.ink3, fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, lineHeight: 1, letterSpacing: '0.02em' }}
              >
                ...
              </button>
            ) : null}
          </div>
          {hasNestedReplies || childReplies.length > 0 ? (
            <>
              <button type="button" onClick={() => onToggleReplies(reply.id)} style={{ background: 'none', border: 'none', padding: 0, marginTop: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: v.ink3, fontFamily: v.fontBody, fontSize: 12, fontWeight: 500 }}>
                <span style={{ display: 'inline-flex', transform: showReplies ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}>
                  <LxIcon name="chevronRight" size={12} color={v.ink3} />
                </span>
                <span>{showReplies ? 'Hide replies' : `View replies (${childReplies.length || 1})`}</span>
              </button>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleLikeToggle}
          className={`lx-heart-button ${heartBurst ? 'is-liked' : ''}`}
          style={{ position: 'absolute', top: 16, right: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <span className="lx-heart-icon" style={{ display: 'inline-flex' }}>
            <LxIcon name="heart" size={16} color={liked ? HEART_COLOR : v.ink3} filled={liked} />
          </span>
        </button>
      </div>
      {!showReplies && hasNestedReplies ? (
        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: v.borderSubtle,
            marginLeft: isNestedReply ? 18 : 0,
            marginRight: 28,
          }}
        />
      ) : null}
      <div
        style={{
          marginTop: showReplies && childReplies.length > 0 ? -nestedRepliesLift : 0,
          display: 'grid',
          gridTemplateRows: showReplies && childReplies.length > 0 ? '1fr' : '0fr',
          opacity: showReplies && childReplies.length > 0 ? 1 : 0,
          overflow: 'hidden',
          transition: 'grid-template-rows 220ms ease, opacity 180ms ease, margin-top 220ms ease',
        }}
      >
        <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {childReplies.map((child) => (
            <CommentRow key={child.id} reply={child} onReply={onReply} indent={indent + 30} expandedReplyIds={expandedReplyIds} onToggleReplies={onToggleReplies} navigate={navigate} postId={postId} authorProfile={authorProfile} />
          ))}
        </div>
      </div>
      <LxDropdownMenu anchorRef={commentMenuButtonRef} open={commentMenuOpen} onClose={() => setCommentMenuOpen(false)} items={commentMenuItems} width={214} align="right" />
    </div>
  );
}

export function PostDetailScreen({ navigate, params = {}, overlay = false }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [heartBurst, setHeartBurst] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [expandedReplyIds, setExpandedReplyIds] = useState(() => new Set());
  const menuButtonRef = useRef(null);
  const commentsPaneRef = useRef(null);
  const commentInputRef = useRef(null);

  const postId = params.postId || params.post?.id;
  const { data: postResponse, isLoading, isError } = usePostDetail(postId);

  const currentUser = useAuthStore((state) => state.user);
  const follow = useFollow();
  const unfollow = useUnfollow();
  const block = useBlock();
  const { data: myFollowingData } = useFollowing(currentUser?.id);
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const post = postResponse?.data || postResponse || params.post || {};
  const targetUserId = post.userId || post.authorId || post.user?.id || post.author?.id;
  const authorName = post.username || post.author || 'unknown';
  const authorHandle = post.username || post.author || 'unknown';
  const authorAvatarUrl = post.userAvatarUrl || post.user?.avatarUrl || null;
  const isSelf = currentUser?.id === targetUserId;
  const following = (() => {
    if (!myFollowingData || !targetUserId || isSelf) return false;
    const list = myFollowingData.pages?.flatMap((page) => page?.data?.content || page?.content || []) || [];
    return list.some((user) => user.id === targetUserId);
  })();

  const likeCount = post.likeCount || post.likes || 0;
  const tags = post.tags || (post.caption ? (post.caption.match(/#(\w+)/g) || []).map((tag) => tag.slice(1)) : []);
  const mediaList = post.media || [];
  const mainMedia = mediaList[0] || null;
  const timeStr = useRelativeTime(post.createdAt || post.time, { seedKey: post.username || post.author || '' });

  useEffect(() => {
    const nextReplies = buildThreadReplies(authorName);
    setThreadReplies(nextReplies);
    setExpandedReplyIds(buildDefaultExpandedReplyIds());
    setReplyingTo(null);
    setCommentDraft('');
  }, [authorName, postId]);

  useEffect(() => {
    if (!replyingTo) return;
    commentInputRef.current?.focus();
  }, [replyingTo]);

  useEffect(() => {
    if (!overlay || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlay]);

  const closePost = () => navigate(-1);

  const handleLikeToggle = () => {
    setHeartBurst(false);
    window.requestAnimationFrame(() => setHeartBurst(true));
    setLiked((previous) => {
      const next = !previous;
      return next;
    });
  };

  const handleFollowToggle = () => {
    if (!targetUserId) return;
    if (following) {
      unfollow.mutate(targetUserId);
      return;
    }
    follow.mutate(targetUserId);
  };

  const handleEditOpen = () => {
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
    if (window.confirm('are you sure you want to delete this post?')) {
      deletePost.mutate(postId, {
        onSuccess: () => navigate(-1),
      });
    }
  };

  const handleBlockConfirm = () => {
    if (!targetUserId) return;
    block.mutate(targetUserId, {
      onSuccess: () => {
        setBlockModalOpen(false);
        navigate(-1);
      },
    });
  };

  const handleCommentSubmit = () => {
    const value = commentDraft.trim();
    if (!value) return;

    const nextId = `local-${Date.now()}`;
    const newReply = {
      id: nextId,
      idx: 0,
      author: currentUser?.username || 'you',
      time: 'now',
      text: value,
      likes: 0,
      children: [],
    };

    if (replyingTo) {
      setThreadReplies((previous) => appendReplyToTree(previous, replyingTo.id, newReply));
      setExpandedReplyIds((previous) => {
        const next = new Set(previous);
        const path = findReplyPath(threadReplies, replyingTo.id) || [replyingTo.id];
        path.forEach((id) => next.add(id));
        next.add(replyingTo.id);
        return next;
      });
    } else {
      setThreadReplies((previous) => [...previous, newReply]);
    }

    setCommentDraft('');
    setReplyingTo(null);
    window.requestAnimationFrame(() => {
      if (commentsPaneRef.current) {
        commentsPaneRef.current.scrollTo({ top: commentsPaneRef.current.scrollHeight, behavior: 'smooth' });
      }
    });
  };

  const handleReplySelect = (reply) => {
    setReplyingTo(reply);
    const path = findReplyPath(threadReplies, reply.id);
    if (path) {
      setExpandedReplyIds((previous) => {
        const next = new Set(previous);
        path.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleToggleReplies = (replyId) => {
    setExpandedReplyIds((previous) => {
      const next = new Set(previous);
      if (next.has(replyId)) {
        next.delete(replyId);
      } else {
        next.add(replyId);
      }
      return next;
    });
  };

  const menuItems = useMemo(
    () => [
      { id: 'like', icon: 'heart', label: liked ? 'Unlike' : 'Like', onClick: handleLikeToggle },
      { id: 'share', icon: 'share', label: 'Share', onClick: () => sharePost(postId, post.caption || post.text) },
      { id: 'copy', icon: 'link', label: 'Copy link', onClick: () => copyPostLink(postId) },
    ],
    [liked, post.caption, post.text, postId]
  );

  if (isLoading) {
    return (
      <div style={{ position: overlay ? 'fixed' : 'relative', inset: overlay ? 0 : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.ink3 }}>
        loading post...
      </div>
    );
  }

  if (isError || !postId) {
    return (
      <div style={{ position: overlay ? 'fixed' : 'relative', inset: overlay ? 0 : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.error, flexDirection: 'column', gap: 8 }}>
        <LxIcon name="explore" size={32} color={v.error} />
        <div>post not found</div>
      </div>
    );
  }

  const container = (
    <div
      style={{
        width: 'min(556px, calc(100vw - 32px))',
        height: 'min(84vh, 728px)',
        background: v.base,
        border: `1px solid ${v.border}`,
        borderRadius: 16,
        boxShadow: '0 24px 80px rgba(26,24,22,0.34)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateRows: 'auto auto minmax(0, 1fr) auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${v.borderSubtle}` }}>
        <LxAvatar size={40} idx={post.idx || 0} src={authorAvatarUrl} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink, lineHeight: 1.15 }}>{authorName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontFamily: v.fontMono, fontSize: 10, color: v.ink3, lineHeight: 1 }}>
            <span>{timeStr}</span>
            <span>ago</span>
          </div>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="lx-header-icon-btn"
          style={{ width: 24, height: 24, marginTop: 2, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <LxIcon name="more" size={14} color={v.ink3} />
        </button>
        <button
          type="button"
          onClick={closePost}
          className="lx-header-icon-btn"
          style={{ width: 24, height: 24, marginTop: 2, marginLeft: 2, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <LxIcon name="close" size={14} color={v.ink3} />
        </button>
      </div>

      <div style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${v.borderSubtle}` }}>
        <div style={{ fontFamily: v.fontBody, fontSize: mainMedia ? 18 : 17, fontWeight: 600, lineHeight: 1.52, color: v.ink, letterSpacing: '-0.025em' }}>
          {post.caption || post.text}
        </div>
        {tags.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {tags.map((tag) => (
              <LxTag key={tag} size="sm">#{tag}</LxTag>
            ))}
          </div>
        ) : null}
      </div>

      <div ref={commentsPaneRef} style={{ minHeight: 0, overflowY: 'auto', padding: '0 16px', scrollBehavior: 'smooth' }}>
        {mainMedia ? (
          <div style={{ padding: '16px 0', borderBottom: `1px solid ${v.borderSubtle}` }}>
            {mainMedia.mediaType === 'VIDEO' ? (
              <video src={mainMedia.cdnUrl} controls style={{ width: '100%', borderRadius: 14, display: 'block' }} />
            ) : (
              <img src={mainMedia.cdnUrl} alt={mainMedia.altText || 'post media'} style={{ width: '100%', borderRadius: 14, display: 'block' }} />
            )}
          </div>
        ) : null}

        {threadReplies.map((reply) => (
          <CommentRow key={reply.id} reply={reply} onReply={handleReplySelect} expandedReplyIds={expandedReplyIds} onToggleReplies={handleToggleReplies} navigate={navigate} postId={postId} authorProfile={{ id: targetUserId, username: authorHandle, displayName: authorName, avatarUrl: authorAvatarUrl }} />
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${v.borderSubtle}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 16px', borderBottom: `1px solid ${v.borderSubtle}` }}>
          <button type="button" onClick={handleLikeToggle} className={`lx-heart-button ${heartBurst ? 'is-liked' : ''}`} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="lx-heart-icon" style={{ display: 'inline-flex' }}>
              <LxIcon name="heart" size={22} color={liked ? HEART_COLOR : v.ink3} filled={liked} />
            </span>
            <span style={{ fontFamily: v.fontMono, fontSize: 12, color: liked ? HEART_COLOR : v.ink3 }}>{liked ? likeCount + 1 : likeCount}</span>
          </button>
          <button type="button" onClick={() => sharePost(postId, post.caption || post.text)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <LxIcon name="share" size={20} color={v.ink3} />
          </button>
        </div>

        {replyingTo ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 14px 7px', borderBottom: `1px solid ${v.borderSubtle}`, background: 'color-mix(in srgb, var(--lx-accent) 14%, var(--lx-surface))', fontFamily: v.fontMono, fontSize: 11, color: v.accentText }}>
            <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ marginRight: 6 }}>↩ replying to @{replyingTo.author}</span>
              <span style={{ color: v.ink2 }}>{replyingTo.text}</span>
            </div>
            <button type="button" onClick={() => setReplyingTo(null)} style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.14)', border: 'none', color: v.ink3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, lineHeight: 1 }}>
              ×
            </button>
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 12px' }}>
          <LxAvatar size={30} idx={0} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ height: 40, borderRadius: 999, border: `1px solid ${v.border}`, background: 'transparent', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
              <input
                ref={commentInputRef}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder={replyingTo ? `reply to @${replyingTo.author}...` : 'add a comment...'}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: v.ink, fontFamily: v.fontBody, fontSize: 14 }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleCommentSubmit();
                  }
                }}
              />
            </div>
          </div>
          <button type="button" onClick={handleCommentSubmit} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: commentDraft.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center' }}>
            <LxIcon name="send" size={18} color={v.accent} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {overlay ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(10, 8, 6, 0.18)', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closePost}>
          <div onClick={(event) => event.stopPropagation()}>{container}</div>
        </div>
      ) : (
        container
      )}

      <LxDropdownMenu anchorRef={menuButtonRef} open={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} width={182} zIndex={1605} />

      <LxModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title="block user"
        actions={
          <>
            <LxBtn variant="ghost" onClick={() => setBlockModalOpen(false)}>cancel</LxBtn>
            <LxBtn variant="danger" onClick={handleBlockConfirm}>block</LxBtn>
          </>
        }
      >
        Are you sure you want to block <strong>{authorName}</strong>? They won't be able to find your profile, posts or story on Luvax.
      </LxModal>

      {isSelf ? (
        <LxModal
          open={editSheetOpen}
          onClose={() => setEditSheetOpen(false)}
          title="edit post"
          actions={<LxBtn variant="primary" onClick={handleEditSubmit}>save changes</LxBtn>}
        >
          <textarea
            value={editCaption}
            onChange={(event) => setEditCaption(event.target.value)}
            placeholder="write a caption..."
            style={{ width: '100%', minHeight: 120, fontFamily: v.fontBody, fontSize: 15, color: v.ink, border: `1px solid ${v.border}`, borderRadius: 8, padding: 12, resize: 'none', outline: 'none', background: v.base }}
          />
        </LxModal>
      ) : null}
    </>
  );
}
