import { useMemo, useRef, useState } from 'react';
import { v } from '@/config/tokens';
import { copyPostLink, extractPageContent, getDisplayName, getUserSummary, isVideoMedia, sharePost } from '@/utils/helpers';
import { LxAvatar, LxBottomSheet, LxBtn, LxDropdownMenu, LxIcon, LxModal, LxTag } from './primitives';
import { useDeletePost, useLikePost, useSavePost, useUpdatePost } from '../hooks/usePosts';
import { useBlock, useFollow, useFollowing, useUnfollow } from '../hooks/useSocial';
import { useAuthStore } from '@/store/useAuthStore';
import { useRelativeTime } from '../hooks/useRelativeTime';

const HEART_COLOR = 'var(--lx-error)';

export function PostCard({ post, navigate, density = 'cozy', showTags = true, viewport = 'desktop' }) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [heartBurst, setHeartBurst] = useState(false);
  const [saveBurst, setSaveBurst] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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

  const handleLikeToggle = () => {
    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !liked;

    setHeartBurst(false);
    window.requestAnimationFrame(() => setHeartBurst(true));
    setLiked(nextLiked);
    setLikeCount((count) => count + (nextLiked ? 1 : -1));

    likeMutation.mutate(
      { postId: post.id, liked: previousLiked },
      {
        onSuccess: (data) => {
          const result = data?.data || data;
          if (typeof result?.likeCount === 'number') {
            setLikeCount(result.likeCount);
          }
        },
        onError: () => {
          setLiked(previousLiked);
          setLikeCount(previousCount);
        },
      }
    );
  };

  const handleSaveToggle = () => {
    const previousSaved = saved;
    const nextSaved = !saved;

    setSaveBurst(false);
    window.requestAnimationFrame(() => setSaveBurst(true));
    setSaved(nextSaved);

    saveMutation.mutate(
      { postId: post.id, saved: previousSaved },
      {
        onError: () => {
          setSaved(previousSaved);
        },
      }
    );
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
  const media = post.media && post.media.length > 0 ? post.media[0] : null;
  const isMobile = viewport === 'mobile';
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
            onClick: () =>
              navigate('profile', {
                user: {
                  id: targetUserId,
                  username: authorHandle,
                  displayName: authorName,
                  avatarUrl,
                },
              }),
          }
        : null,
      !isOwner
        ? {
            id: 'follow-toggle',
            icon: 'profile',
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
            icon: 'close',
            label: `Block @${authorHandle}`,
            tone: 'danger',
            onClick: () => block.mutate(targetUserId),
          }
        : null,
      !isOwner
        ? {
            id: 'report',
            icon: 'flag',
            label: 'Report',
            tone: 'danger',
            onClick: () => {},
          }
        : null,
    ],
    [authorHandle, authorName, avatarUrl, block, follow.isPending, following, isOwner, liked, myFollowingData, navigate, post.caption, post.id, targetUserId, unfollow.isPending]
  );

  return (
    <article
      style={{
        background: isMobile ? 'transparent' : v.surface,
        borderRadius: isMobile ? 0 : 14,
        border: isMobile ? 'none' : `1px solid ${v.borderSubtle}`,
        boxShadow: isMobile ? 'none' : '0 2px 8px rgba(26,24,22,0.06)',
        paddingBottom: isMobile ? 12 : 0,
        borderBottom: isMobile ? `1px solid ${v.border}` : 'none',
      }}
    >
      {block.isError ? (
        <div
          role="alert"
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

      {media && media.cdnUrl ? (
        <div
          onClick={() => navigate('post', { postId: post.id })}
          style={{
            cursor: 'pointer',
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderTopLeftRadius: isMobile ? 0 : 14,
            borderTopRightRadius: isMobile ? 0 : 14,
          }}
        >
          {isVideoMedia(media) ? (
            <video
              src={media.cdnUrl}
              style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: isMobile ? 360 : 500 }}
              controls
              muted
            />
          ) : (
            <img
              src={media.cdnUrl}
              alt={media.altText || 'post image'}
              style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: isMobile ? 360 : 500 }}
            />
          )}
        </div>
      ) : null}

      {!media && post.type === 'image' && post.media ? (
        <div
          onClick={() => navigate('post', { postId: post.id })}
          style={{
            height: post.media.h,
            background: post.media.color,
            cursor: 'pointer',
            borderTopLeftRadius: isMobile ? 0 : 14,
            borderTopRightRadius: isMobile ? 0 : 14,
          }}
        />
      ) : null}

      <div style={{ padding: isMobile ? '14px 14px 10px' : pad }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: gap }}>
          <div
            onClick={() =>
              navigate('profile', {
                user: {
                  id: targetUserId,
                  username: author.username,
                  displayName: authorName,
                  avatarUrl,
                },
              })
            }
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <LxAvatar size={28} src={avatarUrl} />
            <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink }}>
              {authorName}
            </span>
          </div>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>·</span>
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{timeStr}</span>

          <button
            ref={menuButtonRef}
            type="button"
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
          onClick={() => navigate('post', { postId: post.id })}
          style={{
            fontFamily: v.fontBody,
            fontSize: post.postType === 'TEXT' || post.type === 'text' ? 18 : 14,
            color: v.ink,
            lineHeight: 1.45,
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
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: liked ? HEART_COLOR : v.ink3 }}>
              {likeCount}
            </span>
          </button>
          <button onClick={() => navigate('post', { postId: post.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <LxIcon name="reply" size={17} color={v.ink3} />
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
              {post.commentCount ?? 0}
            </span>
          </button>
          <button type="button" onClick={() => sharePost(post.id, post.caption)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <LxIcon name="share" size={17} color={v.ink3} />
          </button>
          <button onClick={handleSaveToggle} className={saveBurst ? 'lx-bookmark-button is-saved' : 'lx-bookmark-button'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
            <span className="lx-bookmark-icon" style={{ display: 'inline-flex' }}>
              <LxIcon name="bookmark" size={17} color={saved ? v.ink : v.ink3} filled={saved} />
            </span>
          </button>
        </div>
      </div>

      <LxDropdownMenu anchorRef={menuButtonRef} open={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} width={248} />

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
    </article>
  );
}
