import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent, formatCount, getUserSummary } from '@/utils/helpers';
import { LxBtn, LxDropdownMenu, LxIcon } from './primitives';
import { MediaThumb } from './MediaThumb';
import { ReportModal } from './ReportModal';
import { REPORT_TYPES } from '@/services/report.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useLikedPosts, useUserPosts } from '../hooks/usePosts';
import { useUserProfile } from '../hooks/useUsers';
import { useFollow, useUnfollow, useFollowing } from '../hooks/useSocial';
import { useOverlayNavigate } from '../hooks/useOverlayNavigate';
import { useLuvaxTweaks } from '../LuvaxTweaksContext';
import { ROUTES, routeTo } from '@/config/constants';

export function ProfileScreen() {
  const navigate = useNavigate();
  const openOverlay = useOverlayNavigate();
  const { viewport } = useLuvaxTweaks();
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const menuButtonRef = useRef(null);
  const currentUser = useAuthStore(state => state.user);

  // Absent on the viewer's own profile address, which is what makes that
  // address constructible before the user object has loaded.
  const { userId: targetUserId } = useParams();
  const isSelf = !targetUserId || targetUserId === currentUser?.id;
  
  const queryUserId = targetUserId || currentUser?.id;
  const { data: profileResponse, isError: isProfileError, isLoading: isProfileLoading } =
    useUserProfile(queryUserId);
  const fetchedUser = profileResponse?.data || profileResponse;

  const user = fetchedUser || (isSelf ? currentUser : null);

  const follow = useFollow();
  const unfollow = useUnfollow();
  const { data: myFollowingData } = useFollowing(currentUser?.id);

  useEffect(() => {
    if (myFollowingData && !isSelf) {
      const list = myFollowingData.pages?.flatMap(page => extractPageContent(page)) || [];
      // Follower lists return UserListItemResponse, which nests the user.
      setFollowing(list.some(item => getUserSummary(item, 'user').id === targetUserId));
    }
  }, [myFollowingData, targetUserId, isSelf]);

  const handleFollowToggle = () => {
    if (following) {
      unfollow.mutate(user.id);
      setFollowing(false);
    } else {
      follow.mutate(user.id);
      setFollowing(true);
    }
  };

  const { ref, inView } = useInView();

  // The photos tab asks the server for the types that carry pictures rather
  // than filtering a page of mixed posts on the client, which would leave the
  // tab showing fewer items than a page holds. A carousel is included because
  // a carousel of photographs is what most people mean by photos.
  const typeFilter = tab === 'photos' ? { type: 'image,carousel' } : {};
  const ownPostsEnabled = tab !== 'liked';

  const {
    data: postsResponse,
    isLoading: ownLoading,
    isError: ownError,
    fetchNextPage: fetchNextOwn,
    hasNextPage: hasNextOwn,
    isFetchingNextPage: isFetchingNextOwn
  } = useUserPosts(user?.id, typeFilter);

  const {
    data: likedResponse,
    isLoading: likedLoading,
    isError: likedError,
    fetchNextPage: fetchNextLiked,
    hasNextPage: hasNextLiked,
    isFetchingNextPage: isFetchingNextLiked
  } = useLikedPosts(tab === 'liked');

  const isLoading = ownPostsEnabled ? ownLoading : likedLoading;
  const isPostsError = ownPostsEnabled ? ownError : likedError;
  const fetchNextPage = ownPostsEnabled ? fetchNextOwn : fetchNextLiked;
  const hasNextPage = ownPostsEnabled ? hasNextOwn : hasNextLiked;
  const isFetchingNextPage = ownPostsEnabled ? isFetchingNextOwn : isFetchingNextLiked;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten the infinite paginated response. The liked list answers with
  // { likedAt, post } rows rather than bare posts, so the post is lifted out
  // and the grid below sees one shape either way.
  const activeResponse = ownPostsEnabled ? postsResponse : likedResponse;
  const posts = (activeResponse?.pages?.flatMap(page => extractPageContent(page)) || [])
    .map(row => (row && row.post ? row.post : row));

  const hasIdentifiableUser = Boolean(user?.displayName || user?.firstName || user?.username);

  // The address carries only an id, so nothing can be shown until the profile
  // arrives. Rendering the frame with empty fields would flash a placeholder
  // name before replacing it.
  if (isProfileLoading && !hasIdentifiableUser) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: v.fontBody, fontSize: 14, color: v.ink3 }}>
        loading profile...
      </div>
    );
  }

  if (isProfileError && !hasIdentifiableUser) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: v.fontBody, fontSize: 14, color: v.error }}>
        we couldn't load this profile. check your connection and try again.
      </div>
    );
  }

  const cols = viewport === 'desktop' ? 3 : viewport === 'tablet' ? 3 : 3;
  const title = user?.displayName || user?.firstName || user?.username || 'Unknown';
  const handle = user?.username || 'unknown';

  // Only ever rendered behind the !isSelf guard on the button that opens it, so the
  // report action cannot appear on the viewer's own profile.
  // On a user the flag is nested under viewerState, unlike posts and comments
  // which carry hasReported at the top level. It is true exactly when a new
  // report would be refused as a duplicate, and a report never reverses, so the
  // row states what happened instead of offering an action that cannot succeed.
  const profileMenuItems = [
    user?.viewerState?.hasReported
      ? { id: 'report', icon: 'flag', label: 'Reported', readOnly: true }
      : {
          id: 'report',
          icon: 'flag',
          label: 'Report',
          tone: 'danger',
          onClick: () =>
            setReportTarget({
              entityType: REPORT_TYPES.USER,
              entityId: user?.id,
              author: title,
              avatarUrl: user?.avatarUrl,
            }),
        },
  ];
  const showHandle = Boolean(user?.username) && user?.displayName && user.displayName.toLowerCase() !== handle.toLowerCase();
  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Cover band */}
        <div style={{ height: 88, background: v.surfaceRaised }} />

        {/* Avatar + follow */}
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: user?.avatarUrl ? `url(${user.avatarUrl}) center/cover no-repeat` : v.avatar0,
            border: `3px solid var(--lx-base)`,
            flexShrink: 0,
          }} />
          {!isSelf && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2, transform: 'translateY(6px)' }}>
              <LxBtn
                variant={following ? 'secondary' : 'primary'}
                size="sm"
                style={{ marginBottom: 0 }}
                onClick={handleFollowToggle}
                disabled={follow.isPending || unfollow.isPending}>
                {following ? 'following' : 'follow'}
              </LxBtn>
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="More options"
                onClick={() => setMenuOpen((open) => !open)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: `1px solid ${v.border}`,
                  background: 'transparent',
                  color: v.ink2,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <LxIcon name="more" size={16} color={v.ink2} />
              </button>
            </div>
          )}
          {isSelf && (
            <LxBtn variant="secondary" size="sm" style={{ marginBottom: 2, transform: 'translateY(6px)' }} onClick={() => navigate(ROUTES.SETTINGS)}>
              edit profile
            </LxBtn>
          )}
        </div>

        {/* Name + bio */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: v.fontDisplay, fontSize: 22, fontWeight: 700, color: v.ink, letterSpacing: '-0.02em' }}>{title}</div>
            {user?.isVerified && <LxIcon name="check" size={18} color={v.accent} />}
          </div>
          {showHandle ? <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 4 }}>@{handle}</div> : null}
          <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5, marginTop: user?.bio ? 10 : 0, maxWidth: 480 }}>{user?.bio || ''}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28, padding: '16px 16px 16px', borderBottom: `1px solid ${v.border}` }}>
          {[['posts', formatCount(user?.postCount)], ['following', formatCount(user?.followingCount)], ['followers', formatCount(user?.followerCount)]].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1, cursor: label !== 'posts' ? 'pointer' : 'default' }}
                 onClick={() => {
                   if (!user?.id) return;
                   if (label === 'followers') navigate(routeTo.userFollowers(user.id));
                   if (label === 'following') navigate(routeTo.userFollowing(user.id));
                 }}>
              <span style={{ fontFamily: v.fontMono, fontSize: 16, fontWeight: 500, color: v.ink }}>{val}</span>
              <span style={{ fontFamily: v.fontMono, fontSize: 9, color: v.ink3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${v.border}` }}>
          {['posts', 'photos', 'liked'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, fontFamily: v.fontBody, fontSize: 13, fontWeight: 500,
              color: tab === t ? v.ink : v.ink3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 0',
              borderBottom: tab === t ? `2px solid var(--lx-ink)` : '2px solid transparent',
              marginBottom: -1, letterSpacing: '0.01em',
            }}>{t}</button>
          ))}
        </div>

        {/* Grid */}
        {isPostsError ? (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: v.fontBody, fontSize: 14, color: v.error }}>
            we couldn't load these posts. check your connection and try again.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, padding: 2 }}>
            {posts.map(p => {
              const hasMedia = (p.media || []).length > 0;
              return (
                <div key={p.id} onClick={() => openOverlay(routeTo.postDetail(p.id))} style={{ cursor: 'pointer' }}>
                  {hasMedia ? (
                    <MediaThumb post={p} radius={4} />
                  ) : (
                    // Only text posts reach this branch, and a caption tile is the
                    // correct treatment for a post that genuinely carries no media.
                    <div style={{
                      aspectRatio: '1/1',
                      borderRadius: 4,
                      background: 'color-mix(in srgb, var(--lx-surface-raised) 82%, #d8d1c4 18%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 10,
                      boxSizing: 'border-box'
                    }}>
                      {p.caption ? (
                        <span style={{ fontSize: 11, fontFamily: v.fontBody, color: v.ink3, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.caption}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasNextPage && !isPostsError && (
          <div ref={ref} style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
            {isFetchingNextPage ? 'loading more...' : 'scroll for more'}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      <LxDropdownMenu
        anchorRef={menuButtonRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={profileMenuItems}
        width={214}
        align="right"
      />

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
    </>
  );
}
