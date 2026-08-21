import { useInfiniteQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import { getNextCursor } from '@/utils/helpers';

export const searchKeys = {
  all: ['search'],
  posts: (q) => [...searchKeys.all, 'posts', q],
  users: (q) => [...searchKeys.all, 'users', q],
  hashtags: (q) => [...searchKeys.all, 'hashtags', q],
};

/**
 * The three halves of a search are separate queries against separate endpoints,
 * keyed separately, so one running out of pages does not stop the others and a
 * failure in one does not blank the others.
 *
 * Unlike the feed, a search result is not polled. A search is a deliberate act
 * with a result the user is reading, and refetching it underneath them on a
 * timer would reorder the list while they scroll.
 */
const buildSearchQuery = (queryKey, fetcher, q) => ({
  queryKey,
  queryFn: ({ pageParam = null, signal }) => fetcher(q, pageParam, 10, signal),
  getNextPageParam: getNextCursor,
  initialPageParam: null,
  // Every search endpoint rejects a blank term with 400, so no request is
  // issued until there is something to search for.
  enabled: !!q,
  staleTime: 30000,
  refetchOnWindowFocus: false,
});

export const usePostSearch = (q) =>
  useInfiniteQuery(buildSearchQuery(searchKeys.posts(q), searchService.searchPosts, q));

export const useUserSearch = (q) =>
  useInfiniteQuery(buildSearchQuery(searchKeys.users(q), searchService.searchUsers, q));

export const useHashtagSearch = (q) =>
  useInfiniteQuery(buildSearchQuery(searchKeys.hashtags(q), searchService.searchHashtags, q));
