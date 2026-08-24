import { useInfiniteQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import { getNextCursor } from '@/utils/helpers';

export const searchKeys = {
  all: ['search'],
  posts: (q) => [...searchKeys.all, 'posts', q],
  users: (q) => [...searchKeys.all, 'users', q],
  hashtags: (q) => [...searchKeys.all, 'hashtags', q],
};

export const normalizeUserSearchTerm = (value = '') =>
  String(value)
    .trim()
    .replace(/^@+/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '');

export const getUserSearchTerms = (value = '') => {
  const collapsed = normalizeUserSearchTerm(value);
  const tokenTerms = String(value)
    .trim()
    .split(/\s+/)
    .map((token) => normalizeUserSearchTerm(token));

  return Array.from(new Set([collapsed, ...tokenTerms]))
    .filter((term) => term.length >= 2)
    .slice(0, 3);
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
const buildSearchQuery = (queryKey, fetcher, q, { minLength = 1 } = {}) => ({
  queryKey,
  queryFn: ({ pageParam = null, signal }) => fetcher(q, pageParam, 10, signal),
  getNextPageParam: getNextCursor,
  initialPageParam: null,
  // Every search endpoint rejects a blank term with 400, so no request is
  // issued until there is something to search for.
  enabled: q.length >= minLength,
  staleTime: 30000,
  refetchOnWindowFocus: false,
});

export const usePostSearch = (q) =>
  useInfiniteQuery(buildSearchQuery(searchKeys.posts(q), searchService.searchPosts, q));

export const useUserSearch = (q) => {
  const term = normalizeUserSearchTerm(q);
  return useInfiniteQuery(
    buildSearchQuery(searchKeys.users(term), searchService.searchUsers, term, { minLength: 2 })
  );
};

export const useHashtagSearch = (q) =>
  useInfiniteQuery(buildSearchQuery(searchKeys.hashtags(q), searchService.searchHashtags, q));
