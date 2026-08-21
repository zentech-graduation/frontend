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
};
