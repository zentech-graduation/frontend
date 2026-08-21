/**
 * Fixed lifecycle enumerations for reports.
 *
 * These are not vocabulary values. A human does not configure them and they
 * carry no display metadata from the server, so they come from the API schema
 * rather than from `GET /api/v1/config/vocabularies`. Both sets are the
 * PostgreSQL enum types the backend declares:
 * - report status: the `report_status` enum (migration V64 added `escalated`)
 * - report type: the `report_type` enum
 *
 * The labels below are the panel's own display strings for these fixed states,
 * needed because the vocabulary endpoint does not serve them. Reason values, by
 * contrast, always come from the vocabulary and are never hardcoded.
 */

/** `report_status` enum, in lifecycle order. */
export const REPORT_STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed', 'escalated'];

/** `report_type` enum. */
export const REPORT_TYPES = ['post', 'comment', 'user', 'story', 'message'];

export const REPORT_STATUS_LABELS = {
  pending: 'pending',
  reviewing: 'reviewing',
  resolved: 'resolved',
  dismissed: 'dismissed',
  escalated: 'escalated',
};

export const REPORT_TYPE_LABELS = {
  post: 'post',
  comment: 'comment',
  user: 'user',
  story: 'story',
  message: 'message',
};

/** The two target types the panel can remove or restore; the rest are read-only. */
export const ACTIONABLE_TARGET_TYPES = new Set(['post', 'comment']);
