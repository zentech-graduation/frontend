/**
 * Cache patching for the post interactions that used to live in component state.
 *
 * The same post is held by several caches at once: the feed's infinite list, a
 * profile's list, explore, and its own detail entry. Opening post detail from a
 * feed card renders two of those simultaneously, so a like applied only to the
 * instance that fired the mutation left the other one stale until a refetch.
 * Patching every entry is what keeps two renderings of one post in agreement.
 */

// Prefix keys. Every post query is keyed with parameters after the prefix, so
// matching on the prefix reaches each parameter variant that is currently held.
const POST_LIST_PREFIXES = [['feed'], ['explore'], ['userPosts']];

const applyToPost = (postId, patch) => (cached) => {
  if (!cached) return cached;

  const mapPost = (post) => {
    if (post?.id !== postId) return post;
    const applied = typeof patch === 'function' ? patch(post) : patch;
    return { ...post, ...applied };
  };

  const mapPayload = (payload) => {
    const rows = payload?.data?.content;
    if (Array.isArray(rows)) {
      return { ...payload, data: { ...payload.data, content: rows.map(mapPost) } };
    }
    // The single-post entry carries one row under the same envelope.
    if (payload?.data?.id === postId) {
      return { ...payload, data: mapPost(payload.data) };
    }
    return payload;
  };

  if (Array.isArray(cached.pages)) {
    return { ...cached, pages: cached.pages.map(mapPayload) };
  }

  return mapPayload(cached);
};

/**
 * Patches every cached copy of one post and returns a function restoring them.
 *
 * @param {Object} queryClient the TanStack Query client
 * @param {string} postId the post to patch
 * @param {Object|Function} patch fields to merge, or a function of the current post returning them
 * @returns {Function} restores every entry to the value it held before the patch
 */
export const patchCachedPost = (queryClient, postId, patch) => {
  const entries = POST_LIST_PREFIXES.flatMap((queryKey) =>
    queryClient.getQueriesData({ queryKey })
  ).concat(queryClient.getQueriesData({ queryKey: ['post', postId] }));

  entries.forEach(([queryKey]) => {
    queryClient.setQueryData(queryKey, applyToPost(postId, patch));
  });

  // The snapshots are captured above rather than re-derived, so a rollback
  // cannot reinstate a value that a later interaction has already changed.
  return () => {
    entries.forEach(([queryKey, previous]) => {
      queryClient.setQueryData(queryKey, previous);
    });
  };
};
