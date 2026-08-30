import { describe, expect, it } from 'vitest';

import {
  MAX_RECIPIENTS,
  canAddRecipient,
  canDecideTicket,
  canEscalateTicket,
  findUnknownVariables,
  holdsClaim,
  isAppealCategory,
} from '@/features/admin/lib/supportPolicy';

const APPEALS = [
  'appeal_ban',
  'appeal_suspension',
  'appeal_warning_strike',
  'appeal_content_removal',
];

describe('support queue role gating', () => {
  it.each(APPEALS)('treats %s as an appeal', (category) => {
    expect(isAppealCategory(category)).toBe(true);
  });

  it.each(['bug_report', 'account_access', 'safety_concern', 'other'])(
    'treats %s as an ordinary category',
    (category) => {
      expect(isAppealCategory(category)).toBe(false);
    }
  );

  // The rule that matters: reversing the decision is administrator-only, so a
  // moderator closing an appeal would record a verdict they cannot execute.
  it.each(APPEALS)('refuses a moderator deciding %s', (category) => {
    expect(canDecideTicket({ category }, 'moderator')).toBe(false);
  });

  it.each(APPEALS)('permits an administrator deciding %s', (category) => {
    expect(canDecideTicket({ category }, 'admin')).toBe(true);
  });

  it('permits a moderator deciding a non-appeal', () => {
    expect(canDecideTicket({ category: 'bug_report' }, 'moderator')).toBe(true);
  });

  // Escalation is how an appeal reaches an administrator, so a moderator keeps
  // it even where deciding is refused.
  it('permits escalating an open appeal', () => {
    expect(canEscalateTicket({ category: 'appeal_ban', status: 'in_progress' })).toBe(true);
  });

  it.each(['answered', 'rejected', 'escalated'])('refuses escalating a %s ticket', (status) => {
    expect(canEscalateTicket({ status })).toBe(false);
  });

  it('recognises the claim holder', () => {
    expect(holdsClaim({ assignedTo: 'u1' }, 'u1')).toBe(true);
  });

  it('refuses a claim held by somebody else', () => {
    expect(holdsClaim({ assignedTo: 'u2' }, 'u1')).toBe(false);
  });

  it('refuses an unclaimed ticket', () => {
    expect(holdsClaim({ assignedTo: null }, 'u1')).toBe(false);
  });
});

describe('campaign variable validation', () => {
  it('accepts the two permitted tokens', () => {
    expect(findUnknownVariables('Hi {{username}} and {{fullName}}')).toEqual([]);
  });

  it('tolerates surrounding whitespace', () => {
    expect(findUnknownVariables('Hi {{ username }}')).toEqual([]);
  });

  // Named so the author can fix it, matching the backend, which raises this at
  // save time precisely so a campaign cannot fail later mid-send.
  it('names an unknown token', () => {
    expect(findUnknownVariables('Hi {{email}}')).toEqual(['email']);
  });

  it('reports each unknown token once', () => {
    expect(findUnknownVariables('{{a}} {{a}} {{b}}')).toEqual(['a', 'b']);
  });

  it('finds nothing in a body with no tokens', () => {
    expect(findUnknownVariables('plain text')).toEqual([]);
  });
});

describe('campaign recipient cap', () => {
  const list = (n) => Array.from({ length: n }, (_, i) => ({ id: `u${i}` }));

  it('permits adding below the cap', () => {
    expect(canAddRecipient(list(9), 'new')).toBe(true);
  });

  it('refuses an eleventh recipient', () => {
    expect(canAddRecipient(list(MAX_RECIPIENTS), 'new')).toBe(false);
  });

  // Deduplicated before the cap, matching the backend, so re-adding somebody is
  // a no-op rather than a refusal that blames the cap.
  it('refuses a duplicate without blaming the cap', () => {
    expect(canAddRecipient(list(3), 'u1')).toBe(false);
  });
});
