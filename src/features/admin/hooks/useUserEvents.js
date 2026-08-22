import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/store/useAuthStore';
import { STALE_TIME } from '@/config/constants';

import { adminApi } from '../api/adminApi';
import { getNextPageParam, listQueryKey, panelQueryRetry } from '../lib/pagination';
import { toIso } from '../lib/statistics';

const PAGE_LIMIT = 20;

/**
 * The event types the application writes unconditionally, in every deployment.
 *
 * Read from the backend source, not from the OpenAPI enumeration. The
 * `event_type` database enum declares twenty values; `UserEventRecorder` writes
 * exactly these three. Generating this list from the enumeration would offer
 * seventeen filters that can never return a row, and an administrator who tried
 * one would conclude the log was broken.
 */
const UNCONDITIONAL_EVENT_TYPES = [
  {
    key: 'session_start',
    label: 'session start',
    hint: 'written when a sign-in issues a session',
  },
  {
    key: 'search',
    label: 'search',
    hint: 'written on either search surface; carries the term and the surface',
  },
  {
    key: 'profile_view',
    label: 'profile view',
    hint: "written when one account views another's profile; viewing one's own records nothing",
  },
];

/**
 * Four more types that are written by a second consumer, and only where the
 * service that consumer depends on is actually running.
 *
 * That service is part of the default local stack and is set up for no
 * production deployment, so these four write rows in development and cannot in
 * production. Verified by producing each one against the local stack and
 * reading the log back (`uptake-contract-verification.md` §5.4) — not inferred
 * from configuration.
 */
const ENGAGEMENT_EVENT_TYPES = [
  {
    key: 'post_like',
    label: 'post like',
    hint: 'written when an account likes a post',
  },
  {
    key: 'post_save',
    label: 'post save',
    hint: 'written when an account saves a post',
  },
  {
    key: 'post_view',
    label: 'post view',
    hint: 'written when a post view is registered',
  },
  {
    key: 'post_comment',
    label: 'post comment',
    hint: 'written when an account comments on a post',
  },
];

/**
 * Whether this build is talking to a stack that writes the engagement types.
 *
 * Two signals, and both must agree, because either one alone gets a real case
 * wrong:
 *
 * - `VITE_APP_ENV` is the deployment's own tag, which is the thing that
 *   actually describes which stack the panel faces.
 * - `import.meta.env.DEV` is false in anything `vite build` produces. Without
 *   it, a production bundle built from a checkout whose `.env` still says
 *   `development` would offer four filters that can never match, against a
 *   server that answers 200 with an empty page — which is exactly the failure
 *   this gate exists to prevent.
 *
 * Requiring both errs toward offering fewer filters. That is the safe
 * direction: a filter that is missing costs a reviewer one unfiltered read,
 * where a filter that can never match costs them a false conclusion about the
 * log. Nothing is hidden either way — the unfiltered list still shows every
 * type a row carries.
 */
const writesEngagementEvents = () =>
  import.meta.env.DEV && (import.meta.env.VITE_APP_ENV ?? 'development') === 'development';

/**
 * The event types worth offering as a filter in this environment.
 *
 * Deliberately environment-dependent, and recorded in `design-decisions.md`
 * because a filter list that changes by build is exactly the kind of thing a
 * later reader assumes is a bug.
 */
export const WRITTEN_EVENT_TYPES = writesEngagementEvents()
  ? [...UNCONDITIONAL_EVENT_TYPES, ...ENGAGEMENT_EVENT_TYPES]
  : UNCONDITIONAL_EVENT_TYPES;

/**
 * One account's behavioural events, or every account's when `userId` is omitted.
 *
 * The query is disabled until a range has been committed, which is what makes
 * the screen's "no request until both bounds are set" rule true at the network
 * level rather than only in the interface: both bounds are mandatory and the
 * server answers a request missing either with 400, so the panel does not
 * compose one.
 *
 * The query key carries the range and the filters, so applying a new range or
 * changing the event type starts a fresh cursor sequence rather than replaying
 * one scoped to the previous query.
 */
export function useUserEvents({ userId, range, eventType }) {
  const role = useAuthStore((state) => state.role);
  const enabled = Boolean(range?.fromMs && range?.toMs);

  const from = enabled ? toIso(range.fromMs) : undefined;
  const to = enabled ? toIso(range.toMs) : undefined;

  const query = useInfiniteQuery({
    queryKey: listQueryKey('user-events', role, {
      userId: userId ?? null,
      from: from ?? null,
      to: to ?? null,
      eventType: eventType || null,
    }),
    queryFn: ({ pageParam }) =>
      adminApi.getUserEvents({
        userId: userId || undefined,
        from,
        to,
        eventType: eventType || undefined,
        cursor: pageParam,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: undefined,
    getNextPageParam,
    enabled,
    retry: panelQueryRetry,
    staleTime: STALE_TIME.SHORT,
  });

  const rows = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page?.content ?? []),
    [query.data]
  );

  return {
    rows,
    enabled,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
