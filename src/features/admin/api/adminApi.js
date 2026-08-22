import { axiosClient } from '@/api/axiosClient';

import { buildBody, pickParams } from '../lib/requestContract';

/**
 * Panel API surface.
 *
 * Every call goes through the shared authenticated `axiosClient`, which attaches
 * the bearer token and runs the single-flight 401 refresh; the panel adds no
 * second Axios instance and no second refresh path. Each function unwraps the
 * `ApiResponse` envelope and returns `data`, sends only an endpoint's declared
 * query keys, and builds request bodies field by field.
 */

const unwrap = (response) => response?.data?.data;

// Declared query parameters per endpoint. Anything outside these lists is
// stripped before the request, which the admin endpoints enforce with 400 and
// which is applied to the report endpoints too as a defensive habit.
const REPORTS_QUERY_KEYS = ['status', 'reportType', 'cursor', 'limit'];
// Violations and per-account content take only keyset paging parameters.
const CURSOR_QUERY_KEYS = ['cursor', 'limit'];
// The action log declares exactly these four; there is no date range and no
// target filter (see discipline-contract-verification.md 4.4.2).
const ACTIONS_QUERY_KEYS = ['adminId', 'actionType', 'cursor', 'limit'];
// The account list declares status and role; search declares only q. Both take
// keyset paging. See accounts-contract-verification.md 3.2.
const USERS_QUERY_KEYS = ['status', 'role', 'cursor', 'limit'];
const USER_SEARCH_QUERY_KEYS = ['q', 'cursor', 'limit'];
// The hashtag registry list declares status; search declares q and status.
// See accounts-contract-verification.md 3.4.
const HASHTAGS_QUERY_KEYS = ['status', 'cursor', 'limit'];
const HASHTAG_SEARCH_QUERY_KEYS = ['q', 'status', 'cursor', 'limit'];
// The timeseries declares exactly these four. There is no cursor and no limit:
// the endpoint is not paginated, it returns the whole window in one response.
// See observability-contract-verification.md 1.4.
const STATS_TIMESERIES_QUERY_KEYS = ['metric', 'granularity', 'from', 'to'];
// The activity log declares six. `from` and `to` are mandatory and the caller
// must supply both; the server refuses a request carrying only one of them.
// See observability-contract-verification.md 2.1.
const USER_EVENTS_QUERY_KEYS = ['userId', 'from', 'to', 'eventType', 'cursor', 'limit'];

export const adminApi = {
  /** The one-hour-cached vocabulary lists (report reasons, moderation actions). */
  async getVocabularies() {
    const res = await axiosClient.get('/config/vocabularies');
    return unwrap(res);
  },

  /**
   * One page of the report queue. Also the escalated queue when `status` is
   * `escalated`. The result set differs by role: a moderator sees only pending
   * and reviewing reports.
   */
  async getReports({ status, reportType, cursor, limit } = {}) {
    const params = pickParams({ status, reportType, cursor, limit }, REPORTS_QUERY_KEYS);
    const res = await axiosClient.get('/reports', { params });
    return unwrap(res);
  },

  /** A single report. Returns 404 for a moderator once the report is closed. */
  async getReport(reportId) {
    const res = await axiosClient.get(`/reports/${reportId}`);
    return unwrap(res);
  },

  /** The reported entity itself. One payload shape serves all five entity types. */
  async getReportTarget(reportId) {
    const res = await axiosClient.get(`/admin/reports/${reportId}/target`);
    return unwrap(res);
  },

  /**
   * Resolves a user id to a username via the content endpoint. A moderator may
   * call this, which is what makes the report queue renderable without
   * administrator access.
   */
  async getUserContent(userId) {
    const res = await axiosClient.get(`/admin/content/user/${userId}`);
    return unwrap(res);
  },

  /** The escalated report counter. Administrator only; a moderator receives 403. */
  async getEscalatedCount() {
    const res = await axiosClient.get('/admin/reports/escalated/count');
    return unwrap(res)?.count ?? 0;
  },

  /**
   * The single pending-to-reviewing transition. The request schema accepts all
   * five statuses but only this transition happens; no resolution note is sent,
   * because the recorded note is the reason on resolve and dismiss.
   */
  async markReviewing(reportId) {
    const res = await axiosClient.patch(
      `/reports/${reportId}/status`,
      buildBody({ status: 'reviewing' })
    );
    return unwrap(res);
  },

  async resolveReport(reportId, reason) {
    const res = await axiosClient.patch(
      `/admin/reports/${reportId}/resolve`,
      buildBody({ reason })
    );
    return unwrap(res);
  },

  async dismissReport(reportId, reason) {
    const res = await axiosClient.patch(
      `/admin/reports/${reportId}/dismiss`,
      buildBody({ reason })
    );
    return unwrap(res);
  },

  async escalateReport(reportId, reason) {
    const res = await axiosClient.patch(
      `/admin/reports/${reportId}/escalate`,
      buildBody({ reason })
    );
    return unwrap(res);
  },

  /** Remove a post. Returns an AdminActionResponse directly. */
  async removePost(postId, reason, reportId) {
    const res = await axiosClient.patch(
      `/admin/posts/${postId}/remove`,
      buildBody({ reason, reportId })
    );
    return unwrap(res);
  },

  /**
   * Restore a post. Returns a wrapper `{ action, droppedHashtags }`, unlike
   * every other action endpoint, and the dropped hashtags must be surfaced.
   */
  async restorePost(postId, reason, reportId) {
    const res = await axiosClient.patch(
      `/admin/posts/${postId}/restore`,
      buildBody({ reason, reportId })
    );
    return unwrap(res);
  },

  /** Remove a comment. Returns an AdminActionResponse directly. */
  async removeComment(commentId, reason, reportId) {
    const res = await axiosClient.patch(
      `/admin/comments/${commentId}/remove`,
      buildBody({ reason, reportId })
    );
    return unwrap(res);
  },

  /**
   * Restore a comment. Returns an AdminActionResponse directly, with no
   * dropped-hashtag wrapper, because comments carry no hashtags.
   */
  async restoreComment(commentId, reason, reportId) {
    const res = await axiosClient.patch(
      `/admin/comments/${commentId}/restore`,
      buildBody({ reason, reportId })
    );
    return unwrap(res);
  },

  /**
   * One page of an account's violation history. The result set differs by role:
   * a moderator sees warnings only, an administrator sees warnings and strikes.
   * Rows are a discriminated union on `kind`; the cursor is scoped to the role
   * variant, so replaying it across roles returns INVALID_CURSOR.
   */
  async getViolations({ userId, cursor, limit } = {}) {
    const params = pickParams({ cursor, limit }, CURSOR_QUERY_KEYS);
    const res = await axiosClient.get(`/admin/violations/for-user/${userId}`, { params });
    return unwrap(res);
  },

  /**
   * Issue a warning against an account. The body is exactly `reasonKey` (a key
   * from the report-reason vocabulary) and `note` (required, non-blank, ≤2000).
   * A third active warning auto-issues a strike, reflected in the response's
   * `strikeIssued`, `strike`, and `resultingStatus`.
   */
  async warnUser(userId, { reasonKey, note }) {
    const res = await axiosClient.post(
      `/admin/warnings/for-user/${userId}`,
      buildBody({ reasonKey, note })
    );
    return unwrap(res);
  },

  /** Revoke a warning. Administrator only; a moderator receives 403. */
  async revokeWarning(warningId, { reason, reportId }) {
    const res = await axiosClient.delete(`/admin/warnings/${warningId}`, {
      data: buildBody({ reason, reportId }),
    });
    return unwrap(res);
  },

  /** Revoke a strike. Administrator only; a moderator receives 403. */
  async revokeStrike(strikeId, { reason, reportId }) {
    const res = await axiosClient.delete(`/admin/strikes/${strikeId}`, {
      data: buildBody({ reason, reportId }),
    });
    return unwrap(res);
  },

  /** One page of an account's posts. Both roles may call. */
  async getUserPosts({ userId, cursor, limit } = {}) {
    const params = pickParams({ cursor, limit }, CURSOR_QUERY_KEYS);
    const res = await axiosClient.get(`/admin/content/for-user/${userId}/posts`, { params });
    return unwrap(res);
  },

  /** One page of an account's comments. Both roles may call. */
  async getUserComments({ userId, cursor, limit } = {}) {
    const params = pickParams({ cursor, limit }, CURSOR_QUERY_KEYS);
    const res = await axiosClient.get(`/admin/content/for-user/${userId}/comments`, { params });
    return unwrap(res);
  },

  /**
   * One page of the moderation action log. A moderator sees only its own
   * actions; an administrator sees all. Rows never carry `metadata`. The only
   * declared filters are `adminId` and `actionType`.
   */
  async getActions({ adminId, actionType, cursor, limit } = {}) {
    const params = pickParams({ adminId, actionType, cursor, limit }, ACTIONS_QUERY_KEYS);
    const res = await axiosClient.get('/admin/actions', { params });
    return unwrap(res);
  },

  /**
   * A single action, the only place `metadata` exists. A moderator receives 404
   * for an action it did not perform.
   */
  async getAction(actionId) {
    const res = await axiosClient.get(`/admin/actions/${actionId}`);
    return unwrap(res);
  },

  /**
   * One page of the account list. Administrator only; a moderator receives 403.
   * Declares two filters, `status` and `role`; both are optional and serialised
   * only when set. Rows are `AdminUserListItemResponse`, carrying role and status
   * so a row is renderable and triage-able without a second fetch.
   */
  async getUsers({ status, role, cursor, limit } = {}) {
    const params = pickParams({ status, role, cursor, limit }, USERS_QUERY_KEYS);
    const res = await axiosClient.get('/admin/users', { params });
    return unwrap(res);
  },

  /**
   * One page of an account search. Administrator only. `q` is required and must
   * be at least two characters; the server answers a shorter or blank query with
   * 400, so the caller gates on length before firing. Returns the same row shape
   * as the list. Rate limited (prod 40/min); a 429 carries `Retry-After`.
   */
  async searchUsers({ q, cursor, limit } = {}) {
    const params = pickParams({ q, cursor, limit }, USER_SEARCH_QUERY_KEYS);
    const res = await axiosClient.get('/admin/users/search', { params });
    return unwrap(res);
  },

  /**
   * A single account's detail. Administrator only; a moderator receives 403. The
   * `capabilities` object is a field of this payload rather than a separate
   * endpoint, so it is refetched with the detail after every action; no action
   * response carries capabilities.
   */
  async getUserDetail(userId) {
    const res = await axiosClient.get(`/admin/users/${userId}`);
    return unwrap(res);
  },

  /** Ban an account. Body is `reason` (required) and an optional `reportId`. */
  async banUser(userId, { reason, reportId } = {}) {
    const res = await axiosClient.patch(
      `/admin/users/${userId}/ban`,
      buildBody({ reason, reportId })
    );
    return unwrap(res);
  },

  /** Lift a ban. Body is `reason` (required) and an optional `reportId`. */
  async unbanUser(userId, { reason, reportId } = {}) {
    const res = await axiosClient.patch(
      `/admin/users/${userId}/unban`,
      buildBody({ reason, reportId })
    );
    return unwrap(res);
  },

  /**
   * Suspend an account. Body is `reason` (required), an optional `reportId`, and
   * `durationDays` (1..3650, unit days). The server stores a resulting
   * `suspendedUntil`; the client shows `now + durationDays` in local time before
   * confirming rather than sending an end time.
   */
  async suspendUser(userId, { reason, reportId, durationDays } = {}) {
    const res = await axiosClient.patch(
      `/admin/users/${userId}/suspend`,
      buildBody({ reason, reportId, durationDays })
    );
    return unwrap(res);
  },

  /** Lift a suspension. Body is `reason` (required) and an optional `reportId`. */
  async unsuspendUser(userId, { reason, reportId } = {}) {
    const res = await axiosClient.patch(
      `/admin/users/${userId}/unsuspend`,
      buildBody({ reason, reportId })
    );
    return unwrap(res);
  },

  /**
   * Change an account's role. Body is `role` (required, from the target's
   * `assignableRoles`) and `reason` (required). Promotion to administrator is
   * irreversible: an existing administrator can never be demoted through the API.
   */
  async changeUserRole(userId, { role, reason } = {}) {
    const res = await axiosClient.patch(
      `/admin/users/${userId}/role`,
      buildBody({ role, reason })
    );
    return unwrap(res);
  },

  /**
   * End every session for an account. Revokes all refresh tokens and advances the
   * token epoch, so both the refresh path and every already-issued access token
   * die immediately. Body is `reason` (required) and an optional `reportId`.
   */
  async forceLogout(userId, { reason, reportId } = {}) {
    const res = await axiosClient.post(
      `/admin/users/${userId}/force-logout`,
      buildBody({ reason, reportId })
    );
    return unwrap(res);
  },

  /**
   * One page of the hashtag registry. Administrator only; a moderator receives
   * 403. Declares a `status` filter (`active`/`banned`/`deleted`). Rows are
   * `HashtagAdminResponse`.
   */
  async getHashtags({ status, cursor, limit } = {}) {
    const params = pickParams({ status, cursor, limit }, HASHTAGS_QUERY_KEYS);
    const res = await axiosClient.get('/admin/hashtags', { params });
    return unwrap(res);
  },

  /**
   * One page of a hashtag search. Administrator only. `q` is required (minimum
   * one character; blank is 400) and an optional `status` narrows it. Same row
   * shape as the list. Rate limited on its own bucket (prod 40/min).
   */
  async searchHashtags({ q, status, cursor, limit } = {}) {
    const params = pickParams({ q, status, cursor, limit }, HASHTAG_SEARCH_QUERY_KEYS);
    const res = await axiosClient.get('/admin/hashtags/search', { params });
    return unwrap(res);
  },

  /**
   * Create a hashtag. Body is `name`, `status`, and `note`, all required. The
   * response is the audit `AdminActionResponse`, not the hashtag; the new
   * hashtag's id is carried in `targetEntityId`. A duplicate name returns 409
   * HASHTAG_ALREADY_EXISTS.
   */
  async createHashtag({ name, status, note } = {}) {
    const res = await axiosClient.post('/admin/hashtags', buildBody({ name, status, note }));
    return unwrap(res);
  },

  /**
   * Transition a hashtag's status. Body is `status` and `note`, both required.
   * Returns an `AdminActionResponse`. Banning a hashtag drops it from any post
   * restored later; unbanning returns it to `active`.
   */
  async updateHashtag(hashtagId, { status, note } = {}) {
    const res = await axiosClient.patch(
      `/admin/hashtags/${hashtagId}`,
      buildBody({ status, note })
    );
    return unwrap(res);
  },

  /**
   * Delete a hashtag. Body is `reason` (required). This marks the record
   * `deleted` rather than removing it; it stays queryable under the `deleted`
   * status filter. Returns an `AdminActionResponse`.
   */
  async deleteHashtag(hashtagId, { reason } = {}) {
    const res = await axiosClient.delete(`/admin/hashtags/${hashtagId}`, {
      data: buildBody({ reason }),
    });
    return unwrap(res);
  },

  /**
   * The newest stored statistics snapshot. Administrator only; a moderator
   * receives 403. Takes no parameters at all.
   *
   * `computedAt` is null when nothing has ever been collected, which is a
   * first-class state and not an error: the collection job writes one bucket
   * every 30 minutes and never backfills, so a freshly started or freshly reset
   * deployment genuinely has nothing to show. The figures are read from the last
   * completed bucket, so they are a snapshot up to 30 minutes old, never live.
   */
  async getCurrentStats() {
    const res = await axiosClient.get('/admin/stats/current');
    return unwrap(res);
  },

  /**
   * One metric's stored series over a window. Administrator only.
   *
   * Every parameter is optional to the server, but omitting both bounds means
   * the last 24 hours and supplying exactly one is refused, so the caller always
   * sends both or neither. `granularity` is omitted rather than guessed when the
   * caller has no preference, because the server resolves the only one that has
   * rows behind it.
   *
   * The response restates `metric`, `granularity`, `from`, and `to` as the
   * server resolved them. Read the axis label off the response, never off the
   * request: the server may answer at a different granularity from the one that
   * was asked for.
   */
  async getStatsTimeseries({ metric, granularity, from, to } = {}) {
    const params = pickParams({ metric, granularity, from, to }, STATS_TIMESERIES_QUERY_KEYS);
    const res = await axiosClient.get('/admin/stats/timeseries', { params });
    return unwrap(res);
  },

  /**
   * One cursor page of behavioural events. Administrator only.
   *
   * `from` and `to` are both mandatory — the table is partitioned by time and an
   * unbounded read would scan every partition ever created — and the window may
   * span at most 30 days, inclusive. `userId` is optional; omitting it reads
   * across every account. Rate limited (prod 20/min), the tightest budget in the
   * panel, so the caller fires on commit and never on change.
   */
  async getUserEvents({ userId, from, to, eventType, cursor, limit } = {}) {
    const params = pickParams(
      { userId, from, to, eventType, cursor, limit },
      USER_EVENTS_QUERY_KEYS
    );
    const res = await axiosClient.get('/admin/user-events', { params });
    return unwrap(res);
  },
};
