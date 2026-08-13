import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v } from '@/config/tokens';
import { copyPostLink, extractPageContent, getDisplayName, getUserSummary, sharePost } from '@/utils/helpers';
import { LxAvatar, LxBottomSheet, LxBtn, LxDropdownMenu, LxIcon, LxModal, LxTag } from './primitives';
import { PostMedia } from './PostMedia';
import { useDeletePost, useLikePost, useSavePost, useUpdatePost } from '../hooks/usePosts';
import { useBlock, useFollow, useFollowing, useUnfollow } from '../hooks/useSocial';
import { useAuthStore } from '@/store/useAuthStore';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { useOverlayNavigate } from '../hooks/useOverlayNavigate';
import { ReportModal } from './ReportModal';
import { REPORT_TYPES } from '@/services/report.service';
import { routeTo } from '@/config/constants';

const HEART_COLOR = 'var(--lx-error)';

export function PostCard({ post, density = 'cozy', showTags = true, viewport = 'desktop' }) {
  const navigate = useNavigate();
  const openOverlay = useOverlayNavigate();
  // Read straight from the post the query cache supplies. Holding these in
  // component state is what let two renderings of one post disagree, since the
  // instance that fired the mutation was the only one that moved.
  const liked = post.isLiked ?? false;
  const likeCount = post.likeCount ?? 0;
  const saved = post.isSaved ?? false;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [heartBurst, setHeartBurst] = useState(false);
  const [saveBurst, setSaveBurst] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const menuButtonRef = useRef(null);

  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === post.author?.id;

  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const block = useBlock();
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const { data: myFollowingData } = useFollowing(currentUser?.id);

  // The burst is presentation rather than server state, so it stays local. The
  // like itself, and its rollback, now belong to the mutation.
  const handleLikeToggle = () => {
    setHeartBurst(false);
    window.requestAnimationFrame(() => setHeartBurst(true));
    likeMutation.mutate({ postId: post.id, liked });
  };

  const handleSaveToggle = () => {
    setSaveBurst(false);
    window.requestAnimationFrame(() => setSaveBurst(true));
    saveMutation.mutate({ postId: post.id, saved });
  };

  // The design puts the click on the article and skips it when the event started
  // inside an interactive child, which it marks with data-lxtap.
  const handleCardClick = (event) => {
    if (event.target.closest('[data-lxtap]')) return;
    openOverlay(routeTo.postDetail(post.id));
  };

  const handleEditOpen = () => {
    setEditCaption(post.caption ?? '');
    setEditSheetOpen(true);
  };

  const handleEditSubmit = () => {
    if (editCaption.trim() !== '') {
      updatePost.mutate({ postId: post.id, data: { caption: editCaption } });
      setEditSheetOpen(false);
    }
  };

  const handleDeleteRequest = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    deletePost.mutate(post.id);
    setDeleteConfirmOpen(false);
  };

  const pad = density === 'dense' ? '10px 12px 12px' : '14px 16px 16px';
  const gap = density === 'dense' ? 8 : 10;

  const author = getUserSummary(post);
  const authorName = getDisplayName(author);
  const authorHandle = author.username || 'unknown';
  const targetUserId = author.id;
  const avatarUrl = author.avatarUrl;
  const timeStr = useRelativeTime(post.createdAt, { seedKey: author.username || '' });
  const tags = post.tags || (post.caption ? (post.caption.match(/#(\w+)/g) || []).map((t) => t.slice(1)) : []);
  const isMobile = viewport === 'mobile';
  const isTextPost = String(post.postType || post.type || '').toLowerCase() === 'text';
  const following = (() => {
    if (!myFollowingData || !targetUserId || isOwner) return false;
    const list = myFollowingData.pages?.flatMap((page) => extractPageContent(page)) || [];
    // Follower lists return UserListItemResponse, which nests the user.
    return list.some((item) => getUserSummary(item, 'user').id === targetUserId);
  })();

  const handleFollowToggle = () => {
    if (!targetUserId) return;
    if (following) {
      unfollow.mutate(targetUserId);
      return;
    }
    follow.mutate(targetUserId);
  };

  const menuItems = useMemo(
    () => [
      {
        id: 'like',
        icon: 'heart',
        label: liked ? 'Unlike' : 'Like',
        onClick: handleLikeToggle,
      },
      {
        id: 'share',
        icon: 'share',
        label: 'Share',
        onClick: () => sharePost(post.id, post.caption),
      },
      {
        id: 'copy',
        icon: 'link',
        label: 'Copy link',
        onClick: () => copyPostLink(post.id),
      },
      isOwner
        ? {
            id: 'edit',
            icon: 'edit',
            label: 'edit post',
            onClick: handleEditOpen,
          }
        : null,
      isOwner
        ? {
            id: 'delete',
            icon: 'close',
            label: 'delete post',
            tone: 'danger',
            onClick: handleDeleteRequest,
          }
        : null,
      !isOwner
        ? {
            id: 'view-profile',
            icon: 'profile',
            label: "View author's profile",
            onClick: () => targetUserId && navigate(routeTo.userProfile(targetUserId)),
          }
        : null,
      !isOwner
        ? {
            id: 'follow-toggle',
            // userMinus only in the destructive direction. The design ships the glyph but never
            // uses it, and has no userPlus counterpart, so the follow direction keeps profile.
            icon: following ? 'userMinus' : 'profile',
            label: `${following ? 'Unfollow' : 'Follow'} @${authorHandle}`,
            tone: 'danger',
            separator: true,
            onClick: handleFollowToggle,
            disabled: follow.isPending || unfollow.isPending,
          }
        : null,
      !isOwner
        ? {
            id: 'block',
            icon: 'ban',
            label: `Block @${authorHandle}`,
            tone: 'danger',
            onClick: () => block.mutate(targetUserId),
          }
        : null,
      // hasReported is true exactly when a new report would be refused as a
      // duplicate, and a report never reverses, so the row states what happened
      // instead of offering an action that cannot succeed.
      !isOwner && post.hasReported
        ? { id: 'report', icon: 'flag', label: 'Reported', readOnly: true }
        : null,
      !isOwner && !post.hasReported
        ? {
            id: 'report',
            icon: 'flag',
            label: 'Report',
            tone: 'danger',
            onClick: () =>
              setReportTarget({
                entityType: REPORT_TYPES.POST,
                entityId: post.id,
                author: authorName,
                text: post.caption,
                avatarUrl,
              }),
          }
        : null,
    ],
    [authorHandle, authorName, avatarUrl, block, follow.isPending, following, isOwner, liked, myFollowingData, navigate, post.caption, post.hasReported, post.id, targetUserId, unfollow.isPending]
  );

  return (
    <article
      onClick={handleCardClick}
      style={{
        background: isMobile ? v.base : v.surface,
        borderRadius: isMobile ? 0 : 12,
        overflow: 'hidden',
        boxShadow: isMobile ? 'none' : '0 2px 8px rgba(26,24,22,0.06)',
        cursor: 'pointer',
        paddingBottom: isMobile ? 12 : 0,
        borderBottom: isMobile ? `1px solid ${v.border}` : 'none',
      }}
    >
      {block.isError ? (
        <div
          role="alert"
          data-lxtap="1"
          style={{
            padding: '8px 14px',
            fontFamily: v.fontMono,
            fontSize: 11,
            color: v.errorText,
            background: v.errorDim,
          }}
        >
          couldn&apos;t block @{authorHandle}. try again.
        </div>
      ) : null}

      {/* The article clips its own corners, so the frame needs no radius. */}
      <PostMedia post={post} radius={0} />

      <div style={{ padding: isMobile ? '14px 14px 10px' : pad }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: gap }}>
          <div
            data-lxtap="1"
            onClick={() => targetUserId && navigate(routeTo.userProfile(targetUserId))}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <LxAvatar size={26} src={avatarUrl} />
            <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink }}>
              {authorName}
            </span>
          </div>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>·</span>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{timeStr}</span>

          <button
            ref={menuButtonRef}
            type="button"
            data-lxtap="1"
            onClick={() => setMenuOpen((open) => !open)}
            style={{
              background: 'transparent',
              border: 'none',
              width: 20,
              height: 20,
              cursor: 'pointer',
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: v.ink3,
              padding: 0,
            }}
          >
            <LxIcon name="more" size={15} color={v.ink3} />
          </button>
        </div>

        <p
          style={{
            fontFamily: v.fontBody,
            // postType serialises lower case, like mediaType. Comparing against
            // "TEXT" never matched, so every text post rendered at the image size.
            fontSize: isTextPost ? 16 : 14,
            color: v.ink,
            lineHeight: 1.5,
            margin: 0,
            letterSpacing: '-0.01em',
            cursor: 'pointer',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.caption}
        </p>

        {showTags && tags.length > 0 ? (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: gap }}>
            {tags.map((tag, index) => (
              <LxTag key={`${tag}-${index}`} size="sm">
                #{tag}
              </LxTag>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 18, marginTop: gap + 2, alignItems: 'center' }}>
          <button
            type="button"
            data-lxtap="1"
            onClick={handleLikeToggle}
            className={`lx-heart-button ${heartBurst ? 'is-liked' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: liked ? HEART_COLOR : v.ink3,
            }}
          >
            <span className="lx-heart-icon" style={{ display: 'inline-flex' }}>
              <LxIcon name="heart" size={17} color={liked ? HEART_COLOR : v.ink3} filled={liked} />
            </span>
            {/* The design keeps the count in v.ink3 whether or not the post is liked;
                only the glyph takes the like colour. */}
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
              {likeCount}
            </span>
          </button>
          <button type="button" data-lxtap="1" onClick={() => openOverlay(routeTo.postDetail(post.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <LxIcon name="reply" size={17} color={v.ink3} />
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
              {post.commentCount ?? 0}
            </span>
          </button>
          <button type="button" data-lxtap="1" onClick={() => sharePost(post.id, post.caption)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <LxIcon name="share" size={17} color={v.ink3} />
          </button>
          <button type="button" data-lxtap="1" onClick={handleSaveToggle} className={saveBurst ? 'lx-bookmark-button is-saved' : 'lx-bookmark-button'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
            <span className="lx-bookmark-icon" style={{ display: 'inline-flex' }}>
              <LxIcon name="bookmark" size={17} color={saved ? v.ink : v.ink3} filled={saved} />
            </span>
          </button>
        </div>
      </div>

      {/* These overlays are children of the article, so without the opt-out every
          click inside them would also open the post. */}
      <div data-lxtap="1">
      <LxDropdownMenu anchorRef={menuButtonRef} open={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} width={248} />

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />

      <LxBottomSheet open={editSheetOpen} onClose={() => setEditSheetOpen(false)} height="40vh">
        <div style={{ padding: '4px 16px 8px', borderBottom: `1px solid ${v.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink }}>edit post</div>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <textarea
            value={editCaption}
            onChange={(event) => setEditCaption(event.target.value)}
            placeholder="write a caption..."
            style={{
              width: '100%',
              height: 100,
              fontFamily: v.fontBody,
              fontSize: 15,
              color: v.ink,
              border: `1px solid ${v.border}`,
              borderRadius: 8,
              padding: 12,
              resize: 'none',
              outline: 'none',
            }}
          />
          <LxBtn variant="primary" onClick={handleEditSubmit}>
            save changes
          </LxBtn>
        </div>
      </LxBottomSheet>

      <LxModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="delete post"
        actions={
          <>
            <LxBtn variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>cancel</LxBtn>
            <LxBtn variant="danger" onClick={handleDeleteConfirm}>delete</LxBtn>
          </>
        }
      >
        are you sure you want to delete this post?
      </LxModal>
      </div>
    </article>
  );
}
