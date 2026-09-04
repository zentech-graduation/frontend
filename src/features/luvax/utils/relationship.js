const relationshipSignals = (post, author = post?.author) => [
  post?.viewerState?.author?.isFollowing,
  post?.viewerState?.author?.isFollowedByViewer,
  post?.viewerState?.authorRelationship?.isFollowing,
  post?.viewerState?.authorRelationship?.isFollowedByViewer,
  post?.viewerState?.relationship?.isFollowing,
  post?.viewerState?.relationship?.isFollowedByViewer,
  post?.viewerState?.isFollowingAuthor,
  post?.viewerState?.isAuthorFollowed,
  post?.viewerState?.followsAuthor,
  post?.viewerState?.isFollowing,
  post?.viewerState?.isFollowedByViewer,
  author?.viewerState?.isFollowing,
  author?.viewerState?.isFollowedByViewer,
  author?.relationship?.isFollowing,
  author?.relationship?.isFollowedByViewer,
  author?.isFollowing,
  author?.isFollowedByViewer,
];

export const viewerFollowsAuthor = (post, author) =>
  relationshipSignals(post, author).some((value) => value === true);

export const withRelationshipPatch = (viewerState = {}, patch = {}) => {
  const isFollowing =
    patch.isFollowing ?? patch.isFollowedByViewer ?? viewerState.isFollowingAuthor;

  return {
    ...viewerState,
    ...patch,
    isFollowingAuthor: isFollowing,
    isAuthorFollowed: isFollowing,
    followsAuthor: isFollowing,
    author: { ...(viewerState.author || {}), ...patch },
    authorRelationship: { ...(viewerState.authorRelationship || {}), ...patch },
    relationship: { ...(viewerState.relationship || {}), ...patch },
  };
};
