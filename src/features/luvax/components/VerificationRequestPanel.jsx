import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { v } from '@/config/tokens';
import { LxBtn } from './primitives';
import { LxVerifiedBadge } from '@/components/ui/lx-verified-badge';
import * as verificationService from '@/services/verification.service';

const verificationKeys = {
  all: ['verification'],
  me: () => [...verificationKeys.all, 'me'],
  categories: () => [...verificationKeys.all, 'categories'],
};

// The seven optional evidence fields, in the order the brief lists them. At least three must carry
// text. The rule is enforced by the server and by a CHECK constraint on the table; this list drives
// the count shown before submission so the requester is never refused for something they could have
// been told about while typing.
const EVIDENCE_FIELDS = [
  { name: 'evidenceWebsite', label: 'official website', placeholder: 'https://' },
  {
    name: 'evidenceOtherProfile',
    label: 'a verified profile on another platform',
    placeholder: 'link to the profile',
  },
  {
    name: 'evidenceEmailDomain',
    label: 'an organisational email domain',
    placeholder: 'example.org',
  },
  {
    name: 'evidencePublishedWork',
    label: 'published work, portfolio, discography or publication list',
    placeholder: 'link or description',
  },
  { name: 'evidencePress', label: 'press coverage', placeholder: 'link to an article' },
  {
    name: 'evidenceOfficialListing',
    label: 'an official organisational listing',
    placeholder: 'link to the listing',
  },
  {
    name: 'evidenceNote',
    label: 'a note to the moderator',
    placeholder: 'anything else that helps',
    multiline: true,
  },
];

const MIN_EVIDENCE = 3;

const EMPTY_FORM = {
  categoryKey: '',
  claimedName: '',
  ...Object.fromEntries(EVIDENCE_FIELDS.map((field) => [field.name, ''])),
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 11px',
  borderRadius: 8,
  border: `1px solid ${v.border}`,
  background: v.surface,
  color: v.ink,
  fontFamily: v.fontBody,
  fontSize: 13,
};

/**
 * The requester-facing verification surface.
 *
 * Renders one of three mutually exclusive states, decided by the server rather than guessed here:
 * the account holds a badge, it has an outstanding request, or it can make one. A single endpoint
 * answers all three, so no state is discovered by probing.
 */
export function VerificationRequestPanel() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [failure, setFailure] = useState('');

  const stateQuery = useQuery({
    queryKey: verificationKeys.me(),
    queryFn: ({ signal }) => verificationService.getMyVerification(signal),
    select: (payload) => payload?.data ?? null,
  });
  const categoriesQuery = useQuery({
    queryKey: verificationKeys.categories(),
    queryFn: ({ signal }) => verificationService.getVerificationCategories(signal),
    select: (payload) => payload?.data ?? [],
  });

  const submit = useMutation({
    mutationFn: (payload) => verificationService.submitVerificationRequest(payload),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setFailure('');
      queryClient.invalidateQueries({ queryKey: verificationKeys.me() });
    },
    onError: (error) => setFailure(error?.message || 'that did not work. try again.'),
  });

  const state = stateQuery.data;
  const categories = categoriesQuery.data ?? [];
  const filledEvidence = EVIDENCE_FIELDS.filter(
    (field) => (form[field.name] || '').trim().length > 0
  ).length;
  const remaining = Math.max(0, MIN_EVIDENCE - filledEvidence);
  const canSubmit =
    Boolean(form.categoryKey) &&
    form.claimedName.trim().length > 0 &&
    remaining === 0 &&
    !submit.isPending;

  if (stateQuery.isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="lx-skeleton" style={{ height: 14, width: '48%', borderRadius: 4 }} />
        <div className="lx-skeleton" style={{ height: 34, width: '100%', borderRadius: 8 }} />
        <div className="lx-skeleton" style={{ height: 34, width: '100%', borderRadius: 8 }} />
      </div>
    );
  }

  if (state?.verified) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LxVerifiedBadge verified category={state.categoryKey} iconKey={state.iconKey} size={22} />
        <div>
          <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>
            your account is verified
          </div>
          <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>
            {(state.categoryKey || '').replace(/_/g, ' ')}
          </div>
        </div>
      </div>
    );
  }

  if (state?.pendingRequestId) {
    return (
      <div>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>
          your request is with the review team
        </div>
        <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, marginTop: 4 }}>
          you will get an email when it is decided. one request at a time.
        </div>
      </div>
    );
  }

  return (
    <div>
      {state?.decisionReason ? (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 8,
            background: v.surface,
            border: `1px solid ${v.border}`,
          }}
        >
          <div
            style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em' }}
          >
            LAST DECISION
          </div>
          <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2, marginTop: 4 }}>
            {state.decisionReason}
          </div>
        </div>
      ) : null}

      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink2 }}>category</span>
        <select
          aria-label="verification category"
          value={form.categoryKey}
          onChange={(event) => setForm({ ...form, categoryKey: event.target.value })}
          style={{ ...inputStyle, marginTop: 5 }}
        >
          <option value="">choose a category</option>
          {categories.map((category) => (
            <option key={category.categoryKey} value={category.categoryKey}>
              {category.displayName}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink2 }}>
          the name you are claiming
        </span>
        <input
          aria-label="display name being claimed"
          value={form.claimedName}
          maxLength={100}
          onChange={(event) => setForm({ ...form, claimedName: event.target.value })}
          style={{ ...inputStyle, marginTop: 5 }}
        />
      </label>

      {/* The three-field rule is stated before submission and counted live, rather than surfacing
          as a rejection after the request is sent. A rule the requester only learns by breaking it
          is a rule the interface failed to communicate. */}
      <div
        style={{
          fontFamily: v.fontBody,
          fontSize: 12,
          color: remaining === 0 ? v.ink2 : v.ink3,
          margin: '4px 0 10px',
        }}
        aria-live="polite"
      >
        {remaining === 0
          ? `${filledEvidence} of 7 evidence fields filled. you can submit.`
          : `fill ${remaining} more evidence field${remaining === 1 ? '' : 's'} to submit (${filledEvidence} of 3).`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EVIDENCE_FIELDS.map((field) => (
          <label key={field.name} style={{ display: 'block' }}>
            <span style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink2 }}>
              {field.label}
            </span>
            {field.multiline ? (
              <textarea
                aria-label={field.label}
                rows={3}
                value={form[field.name]}
                placeholder={field.placeholder}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                style={{ ...inputStyle, marginTop: 5, resize: 'vertical' }}
              />
            ) : (
              <input
                aria-label={field.label}
                value={form[field.name]}
                placeholder={field.placeholder}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                style={{ ...inputStyle, marginTop: 5 }}
              />
            )}
          </label>
        ))}
      </div>

      {/* Stated rather than left to be discovered. Somebody who expects to upload a passport needs
          to know the form is complete without one. */}
      <div style={{ fontFamily: v.fontBody, fontSize: 11, color: v.ink3, margin: '12px 0' }}>
        we never ask for identity documents. there is no file upload on this form.
      </div>

      {failure ? (
        <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.error, marginBottom: 10 }}>
          {failure}
        </div>
      ) : null}

      <LxBtn
        variant="primary"
        disabled={!canSubmit}
        onClick={() => {
          setFailure('');
          submit.mutate(form);
        }}
      >
        {submit.isPending ? 'sending...' : 'request verification'}
      </LxBtn>
    </div>
  );
}
