import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v } from '@/config/tokens';
import { copyPostLink, extractPageContent, getDisplayName, getUserSummary, sharePost } from '@/utils/helpers';
import { LxAvatar, LxBtn, LxDropdownMenu, LxIcon, LxModal, LxTag } from './primitives';
import { PostMedia } from './PostMedia';
import { useCreateComment, useDeletePost, useLikePost, usePostDetail, useSavePost, useTopLevelComments, useUpdatePost } from '../hooks/usePosts';
import { useLivePostUpdates } from '../hooks/useLivePostUpdates';
import { useCommentDeletionScope, useCommentReplies, useDeleteComment, useEditComment, useToggleCommentLike } from '../hooks/usePosts';
import { useAuthStore } from '@/store/useAuthStore';
import { useBlock, useFollow, useFollowing, useUnfollow } from '../hooks/useSocial';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { ReportModal } from './ReportModal';
import { ConfirmModal } from './ConfirmModal';
import { REPORT_TYPES } from '@/services/report.service';
import { routeTo } from '@/config/constants';

const HEART_COLOR = 'var(--lx-error)';
// Mirrors the backend's @Size(max = 2200) on the comment body. The client stops
// at the same number rather than inventing a limit of its own.
const COMMENT_MAX_LENGTH = 2200;

function CommentRow({ comment, onReply, indent = 0, postId }) {
  const [heartBurst, setHeartBurst] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [commentMenuOpen, setCommentMenuOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [actionError, setActionError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [estimateLate, setEstimateLate] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const commentMenuButtonRef = useRef(null);
  const navigate = useNavigate();

  // CommentResponse embeds the author as a UserSummaryResponse, so no
  // per-row profile fetch is needed. There is no `comment.userId`.
  const author = getUserSummary(comment);
  const authorName = getDisplayName(author);
  const currentUser = useAuthStore((state) => state.user);
  // Ownership comes from the response rather than from anything the client
  // remembers about who wrote what.
  const isOwn = Boolean(author.id && currentUser?.id && author.id === currentUser.id);

  const timeStr = useRelativeTime(comment.createdAt, { seedKey: comment.id });

  const { data: repliesResponse, isLoading: repliesLoading } = useCommentReplies(comment.id, showReplies);
  const replies = extractPageContent(repliesResponse);

  const toggleLike = useToggleCommentLike(postId);
  const editComment = useEditComment(postId);
  const deleteComment = useDeleteComment(postId);
  const deletionScope = useCommentDeletionScope(comment.id, deleteOpen);

  const isNestedReply = indent > 0;
  const nestedOffset = isNestedReply ? 23 : 0;
  const hasReplies = comment.replyCount > 0;

  // The like state and the count both come from the query cache, so the same
  // comment rendered in two places cannot disagree with itself.
  const liked = Boolean(comment.isLiked);
  const likeCount = comment.likeCount ?? 0;

  const trimmedDraft = draft.trim();
  const draftTooLong = draft.length > COMMENT_MAX_LENGTH;
  const canSaveEdit = trimmedDraft.length > 0 && !draftTooLong && !editComment.isPending;

  const handleLikeToggle = () => {
    setActionError('');
    setHeartBurst(false);
    window.requestAnimationFrame(() => setHeartBurst(true));
    toggleLike.mutate(
      { commentId: comment.id, isLiked: liked, parentId: comment.parentId },
      { onError: (error) => setActionError(error?.message || 'that did not work. try again.') }
    );
  };

  const startEditing = () => {
    setDraft(comment.content);
    setActionError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(comment.content);
    setActionError('');
  };

  const submitEdit = () => {
    if (!canSaveEdit) {
      return;
    }

    editComment.mutate(
      { commentId: comment.id, content: trimmedDraft, parentId: comment.parentId },
      {
        onSuccess: () => {
          setEditing(false);
          setActionError('');
        },
        // The editor stays open holding the draft. The comment above it still
        // shows the saved body, so a rejected edit never reads as though it went
        // through.
        onError: (error) => setActionError(error?.message || 'that edit could not be saved.'),
      }
    );
  };

  // The dialogue is usable without the estimate, so it waits only briefly for
  // one. The deadline is latched only while the request is still outstanding:
  // once an answer is in, it stays on screen. Past the deadline the unnumbered
  // wording stands for the life of the dialogue, rather than the text changing
  // under a user who is already reading it.
  useEffect(() => {
    if (!deleteOpen) {
      setEstimateLate(false);
      return undefined;
    }

    if (!deletionScope.isPending) {
      return undefined;
    }

    const timer = setTimeout(() => setEstimateLate(true), 1500);
    return () => clearTimeout(timer);
  }, [deleteOpen, deletionScope.isPending]);

  const scopeCount = deletionScope.data?.data?.deletedCommentCount;
  const scopeUsable = !estimateLate && typeof scopeCount === 'number';

  const deleteMessage = () => {
    if (scopeUsable) {
      return scopeCount > 1
        ? `deleting this comment removes ${scopeCount} comments in total, including every reply beneath it. this cannot be undone.`
        : 'are you sure you want to delete this comment? this cannot be undone.';
    }

    // Fallback when the estimate failed or was slow. replyCount counts direct
    // replies only, so this understates a deep thread; it says less rather than
    // saying something wrong.
    return hasReplies
      ? `deleting this comment also deletes its ${comment.replyCount === 1 ? 'reply' : `${comment.replyCount} replies`} and any replies to those. this cannot be undone.`
      : 'are you sure you want to delete this comment? this cannot be undone.';
  };

  const confirmDelete = () => {
    deleteComment.mutate(
      { commentId: comment.id, parentId: comment.parentId },
      {
        onSuccess: () => setDeleteOpen(false),
        onError: (error) => {
          setDeleteOpen(false);
          setActionError(error?.message || 'that comment could not be deleted.');
        },
      }
    );
  };

  const commentMenuItems = [
    { id: 'like', icon: 'heart', label: liked ? 'Unlike' : 'Like', onClick: handleLikeToggle },
    { id: 'share', icon: 'share', label: 'Share', onClick: () => sharePost(postId, comment.content) },
    { id: 'copy', icon: 'link', label: 'Copy link', onClick: () => copyPostLink(postId) },
    {
      id: 'view-profile',
      icon: 'profile',
      label: "View author's profile",
      onClick: () => (author.id ? navigate(routeTo.userProfile(author.id)) : null),
    },
    ...(isOwn
      ? [
          { id: 'edit', icon: 'edit', label: 'Edit', separator: true, onClick: startEditing },
          { id: 'delete', icon: 'trash', label: 'Delete', tone: 'danger', onClick: () => setDeleteOpen(true) },
        ]
      : [
          // hasReported is true exactly when a new report would be refused as a
          // duplicate, and a report never reverses, so the row states what
          // happened instead of offering an action that cannot succeed.
          comment.hasReported
            ? { id: 'report', icon: 'flag', label: 'Reported', separator: true, readOnly: true }
            : {
                id: 'report',
                icon: 'flag',
                label: 'Report',
                tone: 'danger',
                separator: true,
                onClick: () =>
                  setReportTarget({
                    entityType: REPORT_TYPES.COMMENT,
                    entityId: comment.id,
                    author: authorName,
                    text: comment.content,
                    avatarUrl: author.avatarUrl,
                  }),
              },
        ]),
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
          borderBottom: `1px solid ${v.borderSubtle}`,
        }}
      >
        <div style={{ marginLeft: indent + nestedOffset }}>
          <LxAvatar size={34} src={author.avatarUrl} />
        </div>
        <div style={{ minWidth: 0, marginLeft: indent + nestedOffset }}>
          {comment.pinned ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 5,
                fontFamily: v.fontMono,
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: v.accent,
              }}
            >
              <LxIcon name="heart" size={9} color={v.accent} filled />
              <span>top comment</span>
            </div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap', lineHeight: 1.42 }}>
            <span style={{ fontFamily: v.fontBody, fontSize: 12.5, fontWeight: 600, color: v.ink }}>{authorName}</span>
            {editing ? null : (
              <span style={{ fontFamily: v.fontBody, fontSize: 12.5, color: v.ink }}>{comment.content}</span>
            )}
          </div>
          {editing ? (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                aria-label="edit comment"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${draftTooLong ? v.error : v.border}`,
                  background: v.surface,
                  color: v.ink,
                  fontFamily: v.fontBody,
                  fontSize: 12.5,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LxBtn variant="primary" size="sm" onClick={submitEdit} disabled={!canSaveEdit}>
                  {editComment.isPending ? 'saving...' : 'save'}
                </LxBtn>
                <LxBtn variant="ghost" size="sm" onClick={cancelEditing}>cancel</LxBtn>
                <span style={{ marginLeft: 'auto', fontFamily: v.fontMono, fontSize: 10, color: draftTooLong ? v.error : v.ink3 }}>
                  {draft.length}/{COMMENT_MAX_LENGTH}
                </span>
              </div>
            </div>
          ) : null}
          {actionError ? (
            <div style={{ marginTop: 6, fontFamily: v.fontBody, fontSize: 11.5, color: v.error }}>{actionError}</div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>
            <span>{timeStr}</span>
            {/* editedAt is set only by a content change. updatedAt also moves when
                the comment is liked or replied to, so it cannot carry this marker. */}
            {comment.editedAt ? <span title="this comment was edited">edited</span> : null}
            <span>{likeCount} likes</span>
            <button
              type="button"
              onClick={() => onReply({ id: comment.id, author: authorName, text: comment.content })}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: v.ink3, fontFamily: v.fontBody, fontSize: 11.5, fontWeight: 500 }}
            >
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
          {hasReplies ? (
            <button
              type="button"
              onClick={() => setShowReplies((value) => !value)}
              style={{ background: 'none', border: 'none', padding: 0, marginTop: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: v.ink3, fontFamily: v.fontBody, fontSize: 12, fontWeight: 500 }}
            >
              <span style={{ display: 'inline-flex', transform: showReplies ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}>
                <LxIcon name="chevronRight" size={12} color={v.ink3} />
              </span>
              <span>{showReplies ? 'Hide replies' : `View replies (${comment.replyCount})`}</span>
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleLikeToggle}
          aria-label={liked ? 'unlike comment' : 'like comment'}
          aria-pressed={liked}
          className={`lx-heart-button ${heartBurst ? 'is-liked' : ''}`}
          style={{ position: 'absolute', top: 16, right: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <span className="lx-heart-icon" style={{ display: 'inline-flex' }}>
            <LxIcon name="heart" size={16} color={liked ? HEART_COLOR : v.ink3} filled={liked} />
          </span>
        </button>
      </div>
      {showReplies && hasReplies ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {repliesLoading ? (
            <div style={{ padding: '8px 28px 8px 63px', fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>loading replies...</div>
          ) : (
            replies.map((reply) => (
              <CommentRow key={reply.id} comment={reply} onReply={onReply} indent={indent + 30} postId={postId} />
            ))
          )}
        </div>
      ) : null}
      <LxDropdownMenu anchorRef={commentMenuButtonRef} open={commentMenuOpen} onClose={() => setCommentMenuOpen(false)} items={commentMenuItems} width={214} align="right" />

      <ConfirmModal
        config={
          deleteOpen
            ? {
                title: 'delete comment',
                // Deletion cascades to the whole subtree and leaves no
                // tombstone, so the consequence is spelled out when there is
                // one, and left unsaid when the comment is a leaf.
                message: deleteMessage(),
                confirmLabel: deleteComment.isPending ? 'deleting...' : 'delete',
                confirmDisabled: deleteComment.isPending,
                onConfirm: confirmDelete,
              }
            : null
        }
        onClose={() => setDeleteOpen(false)}
      />

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
    </div>
  );
}

export function PostDetailScreen({ overlay = false }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [heartBurst, setHeartBurst] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [postReportTarget, setPostReportTarget] = useState(null);
  const menuButtonRef = useRef(null);
  const commentsPaneRef = useRef(null);
  const commentInputRef = useRef(null);

  const { postId } = useParams();
  const { data: postResponse, isLoading, isError } = usePostDetail(postId);

  const currentUser = useAuthStore((state) => state.user);
  const follow = useFollow();
  const unfollow = useUnfollow();
  const block = useBlock();
  const { data: myFollowingData } = useFollowing(currentUser?.id);
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const createComment = useCreateComment(postId);
  const {
    data: commentsResponse,
    isLoading: commentsLoading,
    isError: commentsError,
    fetchNextPage: fetchNextComments,
    hasNextPage: hasNextComments,
    isFetchingNextPage: isFetchingNextComments,
  } = useTopLevelComments(postId);

  // Live updates are scoped to the post the viewer has open, and to this screen
  // alone. They are additive: if the socket never connects, everything below
  // behaves exactly as it did before.
  useLivePostUpdates(postId);

  const post = postResponse?.data || postResponse || {};
  const author = getUserSummary(post);
  const targetUserId = author.id;
  const authorName = getDisplayName(author);
  const authorHandle = author.username || 'unknown';
  const authorAvatarUrl = author.avatarUrl;
  const isSelf = currentUser?.id === targetUserId;
  const following = (() => {
    if (!myFollowingData || !targetUserId || isSelf) return false;
    const list = myFollowingData.pages?.flatMap((page) => extractPageContent(page)) || [];
    // Follower lists return UserListItemResponse, which nests the user.
    return list.some((item) => getUserSummary(item, 'user').id === targetUserId);
  })();

  const tags = post.tags || (post.caption ? (post.caption.match(/#(\w+)/g) || []).map((tag) => tag.slice(1)) : []);
  const mediaList = post.media || [];
  const mainMedia = mediaList[0] || null;
  const timeStr = useRelativeTime(post.createdAt, { seedKey: author.username || '' });
  const comments = commentsResponse?.pages?.flatMap((page) => extractPageContent(page)) || [];

  // Read from the query data, exactly as this file already does for comment
  // like state a few hundred lines above. The previous local copies started at
  // false and only the count was ever synced, so a post the viewer had already
  // liked opened showing an empty heart.
  const liked = Boolean(post.isLiked);
  const likeCount = post.likeCount ?? 0;
  const saved = Boolean(post.isSaved);

  useEffect(() => {
    setReplyingTo(null);
    setCommentDraft('');
  }, [postId]);

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
    likeMutation.mutate({ postId, liked });
  };

  const handleSaveToggle = () => {
    saveMutation.mutate({ postId, saved });
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

  const handleDeleteRequest = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    deletePost.mutate(postId, {
      onSuccess: () => navigate(-1),
    });
    setDeleteConfirmOpen(false);
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

    createComment.mutate(
      { parentId: replyingTo?.id ?? null, content: value },
      {
        onSuccess: () => {
          setCommentDraft('');
          setReplyingTo(null);
          window.requestAnimationFrame(() => {
            if (commentsPaneRef.current) {
              commentsPaneRef.current.scrollTo({ top: commentsPaneRef.current.scrollHeight, behavior: 'smooth' });
            }
          });
        },
      }
    );
  };

  const handleReplySelect = (reply) => {
    setReplyingTo(reply);
  };

  const menuItems = useMemo(
    () => [
      { id: 'like', icon: 'heart', label: liked ? 'Unlike' : 'Like', onClick: handleLikeToggle },
      { id: 'share', icon: 'share', label: 'Share', onClick: () => sharePost(postId, post.caption) },
      { id: 'copy', icon: 'link', label: 'Copy link', onClick: () => copyPostLink(postId) },
      // Kept off the viewer's own post, where the server refuses the report with
      // REPORT_SELF_NOT_ALLOWED and the action could never succeed.
      ...(isSelf
        ? []
        : [
            // hasReported is true exactly when a new report would be refused as
            // a duplicate, and a report never reverses, so the row states what
            // happened instead of offering an action that cannot succeed.
            post.hasReported
              ? { id: 'report', icon: 'flag', label: 'Reported', separator: true, readOnly: true }
              : {
                  id: 'report',
                  icon: 'flag',
                  label: 'Report',
                  tone: 'danger',
                  separator: true,
                  onClick: () =>
                    setPostReportTarget({
                      entityType: REPORT_TYPES.POST,
                      entityId: postId,
                      author: authorName,
                      text: post.caption,
                      avatarUrl: authorAvatarUrl,
                    }),
                },
          ]),
    ],
    [authorAvatarUrl, authorName, isSelf, liked, post.caption, post.hasReported, postId]
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
        <LxAvatar size={40} src={authorAvatarUrl} />
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
          {post.caption}
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
        {mediaList.length > 0 ? (
          <div style={{ padding: '16px 0', borderBottom: `1px solid ${v.borderSubtle}` }}>
            <PostMedia post={post} radius={14} />
          </div>
        ) : null}

        {commentsLoading ? (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>loading comments...</div>
        ) : commentsError ? (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: v.fontBody, fontSize: 13, color: v.error }}>we couldn't load comments. try again.</div>
        ) : comments.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>no comments yet.</div>
        ) : (
          comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} onReply={handleReplySelect} postId={postId} />
          ))
        )}
        {hasNextComments ? (
          <button
            type="button"
            onClick={() => fetchNextComments()}
            disabled={isFetchingNextComments}
            style={{ width: '100%', background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}
          >
            {isFetchingNextComments ? 'loading more...' : 'load more comments'}
          </button>
        ) : null}
      </div>

      <div style={{ borderTop: `1px solid ${v.borderSubtle}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 16px', borderBottom: `1px solid ${v.borderSubtle}` }}>
          <button type="button" onClick={handleLikeToggle} className={`lx-heart-button ${heartBurst ? 'is-liked' : ''}`} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="lx-heart-icon" style={{ display: 'inline-flex' }}>
              <LxIcon name="heart" size={22} color={liked ? HEART_COLOR : v.ink3} filled={liked} />
            </span>
            <span style={{ fontFamily: v.fontMono, fontSize: 12, color: liked ? HEART_COLOR : v.ink3 }}>{likeCount}</span>
          </button>
          <button type="button" onClick={() => sharePost(postId, post.caption)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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

      <ConfirmModal
        config={
          blockModalOpen
            ? {
                title: 'block user',
                // Wording carried over unchanged from the modal this replaces.
                // It was written against the backend's actual behaviour in an
                // earlier phase, so the migration must not reword it.
                message: (
                  <>
                    Are you sure you want to block <strong>{authorName}</strong>? They won&apos;t be able to find your profile, posts or story on Luvax.
                    {block.isError ? (
                      <div role="alert" style={{ marginTop: 12, fontFamily: v.fontMono, fontSize: 11, color: v.errorText }}>
                        couldn&apos;t block this account. try again.
                      </div>
                    ) : null}
                  </>
                ),
                confirmLabel: 'block',
                confirmDisabled: block.isPending,
                onConfirm: handleBlockConfirm,
              }
            : null
        }
        onClose={() => setBlockModalOpen(false)}
      />

      <ConfirmModal
        config={
          deleteConfirmOpen
            ? {
                title: 'delete post',
                message: 'are you sure you want to delete this post?',
                confirmLabel: 'delete',
                onConfirm: handleDeleteConfirm,
              }
            : null
        }
        onClose={() => setDeleteConfirmOpen(false)}
      />

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

      <ReportModal target={postReportTarget} onClose={() => setPostReportTarget(null)} />
    </>
  );
}
