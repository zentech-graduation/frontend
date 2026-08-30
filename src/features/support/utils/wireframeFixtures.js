/**
 * Stubbed data for the wireframes only.
 *
 * Deliberately one file, so phase two replaces it with real hooks by deleting
 * this and its imports rather than hunting for scattered literals.
 */
export const WIRE_CATEGORIES = [
  { key: 'account_access', displayName: 'Account access', isAppeal: false, allowsPublicForm: true },
  { key: 'account_data', displayName: 'Account data', isAppeal: false, allowsPublicForm: true },
  { key: 'bug_report', displayName: 'Report a bug', isAppeal: false, allowsPublicForm: true },
  { key: 'safety_concern', displayName: 'Safety concern', isAppeal: false, allowsPublicForm: true },
  { key: 'other', displayName: 'Something else', isAppeal: false, allowsPublicForm: true },
];

export const WIRE_OPEN_TICKET = {
  id: '0f7b1c2e-1111-4a2b-9c3d-000000000001',
  category: 'bug_report',
  subject: 'Uploads fail on the second image',
  body: 'Every carousel post stops at the second image and never finishes.',
  status: 'in_progress',
  source: 'authenticated',
  staffResponse: null,
  respondedAt: null,
  createdAt: '2026-08-24T09:12:00Z',
};

export const WIRE_ANSWERED_TICKET = {
  ...WIRE_OPEN_TICKET,
  id: '0f7b1c2e-1111-4a2b-9c3d-000000000002',
  status: 'answered',
  staffResponse:
    'Thanks for the detail. This was a size limit on the second upload slot and it is fixed now.',
  respondedAt: '2026-08-26T14:03:00Z',
};

export const WIRE_APPEAL_CONTEXT = {
  category: 'appeal_ban',
  categoryLabel: 'Appeal a ban',
  actionLabel: 'Account banned',
  occurredAt: '2026-08-20T11:00:00Z',
};
