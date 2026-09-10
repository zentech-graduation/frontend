import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LxIcon } from '@/components/ui/lx-icon';
import { v } from '@/config/tokens';
import { routeTo } from '@/config/constants';
import {
  useCreateTicket,
  useCreateVerificationRequest,
  useOwnTickets,
  useSupportCategories,
  useVerificationCategories,
  useVerificationState,
} from '../hooks/useSupport';
import {
  EVIDENCE_FIELDS,
  MIN_EVIDENCE_FIELDS,
  countEvidence,
  ticketSchema,
  verificationSchema,
} from '../utils/supportSchemas';
import { describeSupportError, isAlreadyOpen } from '../utils/supportErrors';
import {
  VERIFICATION_CATEGORY,
  findBlockingTicket,
  findPendingVerification,
  statusLabel,
} from '../utils/ticketStatus';
import { Eyebrow, Field, Notice, PrimaryButton, StatusChip } from './SupportPrimitives';
import { inputStyle } from './fieldStyles';

const VERIFICATION_KEY = 'verification_request';

// Built from EVIDENCE_FIELDS rather than repeated, so a field cannot exist on
// the form under a name the initial state has never heard of.
const EMPTY_VERIFICATION = {
  categoryKey: '',
  claimedName: '',
  ...Object.fromEntries(EVIDENCE_FIELDS.map((field) => [field.name, ''])),
};

/**
 * The help centre: one door into support for the signed-in account.
 *
 * Verification lives here as a category rather than on its own screen. It is a
 * support request like any other, and it previously sat on a surface the user
 * had no other route into, so a badge request and a ban appeal were reached in
 * two unrelated ways.
 *
 * The one-open-ticket rule is a first-class state, not an error. An account
 * already holding a live request sees that request instead of a form, because
 * the server would refuse a second one and a form that cannot be submitted is
 * worse than no form.
 *
 * A pending verification request is deliberately not treated as blocking. The
 * backend excludes that category from the one-open-ticket index so a badge
 * request cannot stop the same account opening a ban appeal, and this mirrors
 * it: both are shown, and the form stays available for the other.
 */
export function HelpCenterScreen() {
  const ticketsQuery = useOwnTickets();
  const categoriesQuery = useSupportCategories();
  const verificationCategoriesQuery = useVerificationCategories();
  const verificationStateQuery = useVerificationState();
  const createTicket = useCreateTicket();
  const createVerification = useCreateVerificationRequest();

  const [category, setCategory] = useState('');
  const [values, setValues] = useState({ subject: '', body: '' });
  const [verification, setVerification] = useState(EMPTY_VERIFICATION);
  const [fieldErrors, setFieldErrors] = useState({});

  // Memoised so the two derivations below depend on a stable reference. Without
  // it the ?? [] produces a fresh array on every render and both memos recompute
  // every time regardless.
  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);
  const blocking = useMemo(() => findBlockingTicket(tickets), [tickets]);
  const pendingVerification = useMemo(() => findPendingVerification(tickets), [tickets]);
  const isVerification = category === VERIFICATION_KEY;
  const verificationState = verificationStateQuery.data;

  const filledEvidence = countEvidence(verification);
  const evidenceRemaining = Math.max(0, MIN_EVIDENCE_FIELDS - filledEvidence);

  const submitting = createTicket.isPending || createVerification.isPending;
  const failure = createTicket.error || createVerification.error;

  const resetForm = () => {
    setCategory('');
    setValues({ subject: '', body: '' });
    setVerification(EMPTY_VERIFICATION);
    setFieldErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isVerification) {
      const parsed = verificationSchema.safeParse(verification);
      if (!parsed.success) {
        const next = {};
        for (const issue of parsed.error.issues) {
          next[issue.path[0]] = issue.message;
        }
        setFieldErrors(next);
        return;
      }
      setFieldErrors({});
      createVerification.mutate(parsed.data, {
        onSuccess: () => {
          resetForm();
          ticketsQuery.refetch();
        },
      });
      return;
    }

    const parsed = ticketSchema.safeParse({ ...values, category });
    if (!parsed.success) {
      const next = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0]] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    createTicket.mutate(parsed.data, {
      onSuccess: () => {
        resetForm();
        ticketsQuery.refetch();
      },
    });
  };

  const categories = categoriesQuery.data ?? [];
  const verificationCategories = verificationCategoriesQuery.data ?? [];

  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <h1
        style={{
          fontFamily: v.fontDisplay,
          fontSize: 30,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          color: v.ink,
          margin: '0 0 6px',
          fontWeight: 700,
        }}
      >
        help
      </h1>
      <p
        style={{
          fontFamily: v.fontBody,
          fontSize: 15,
          color: v.ink2,
          margin: '0 0 24px',
          lineHeight: 1.5,
        }}
      >
        ask us something, appeal a decision, or request a verified badge. one request, one reply.
      </p>

      {ticketsQuery.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="lx-skeleton" style={{ height: 16, width: '40%', borderRadius: 4 }} />
          <div className="lx-skeleton" style={{ height: 92, borderRadius: 12 }} />
        </div>
      ) : null}

      {ticketsQuery.isError ? (
        <Notice tone="bad" role="alert">
          we could not load your requests. reload the page.
        </Notice>
      ) : null}

      {!ticketsQuery.isLoading && !ticketsQuery.isError ? (
        <>
          {verificationState?.verified ? (
            <Notice tone="good">
              your account is verified in {(verificationState.categoryKey ?? '').replace(/_/g, ' ')}
              .
            </Notice>
          ) : null}

          {pendingVerification ? (
            <TicketSummary
              ticket={pendingVerification}
              heading="your verification request"
              to={routeTo.supportTicket(pendingVerification.id)}
            />
          ) : null}

          {blocking ? (
            <>
              <TicketSummary
                ticket={blocking}
                heading="your open request"
                to={routeTo.supportTicket(blocking.id)}
              />
              <Notice>
                you can hold one open request at a time. we will reply to this one before you can
                send another.
                {pendingVerification
                  ? ' your verification request sits alongside it and does not count towards this.'
                  : ''}
              </Notice>
            </>
          ) : (
            <TicketForm
              category={category}
              setCategory={(next) => {
                setCategory(next);
                setFieldErrors({});
              }}
              values={values}
              setValues={setValues}
              verification={verification}
              setVerification={setVerification}
              verificationCategories={verificationCategories}
              categories={categories}
              categoriesLoading={categoriesQuery.isLoading}
              categoriesError={categoriesQuery.isError}
              isVerification={isVerification}
              pendingVerification={pendingVerification}
              alreadyVerified={Boolean(verificationState?.verified)}
              fieldErrors={fieldErrors}
              filledEvidence={filledEvidence}
              evidenceRemaining={evidenceRemaining}
              submitting={submitting}
              onSubmit={handleSubmit}
              failureMessage={
                failure
                  ? isAlreadyOpen(failure)
                    ? 'you already have an open request.'
                    : describeSupportError(failure)
                  : ''
              }
            />
          )}

          <PastTickets
            tickets={tickets}
            blockingId={blocking?.id}
            pendingVerificationId={pendingVerification?.id}
          />
        </>
      ) : null}
    </div>
  );
}

function TicketSummary({ ticket, heading, to }) {
  return (
    <div
      style={{
        background: v.surface,
        border: `1px solid ${v.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 16,
      }}
    >
      <Eyebrow>{heading}</Eyebrow>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontFamily: v.fontBody, fontSize: 15, color: v.ink, fontWeight: 500 }}>
          {ticket.subject}
        </div>
        <StatusChip label={statusLabel(ticket.status)} />
      </div>
      {/* Also a link, for the same reason, and with the same 44px target. */}
      <Link
        to={to}
        style={{
          marginTop: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
          fontFamily: v.fontBody,
          fontSize: 14,
          color: v.accentText,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        <span>read it</span>
        <LxIcon name="chevronRight" size={14} color={v.accentText} />
      </Link>
    </div>
  );
}

function PastTickets({ tickets, blockingId, pendingVerificationId }) {
  const past = tickets.filter(
    (ticket) => ticket.id !== blockingId && ticket.id !== pendingVerificationId
  );
  if (past.length === 0) {
    return null;
  }
  return (
    <section style={{ marginTop: 30 }}>
      <Eyebrow>everything you have sent</Eyebrow>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {past.map((ticket) => (
          <li
            key={ticket.id}
            style={{
              borderBottom: `1px solid ${v.borderSubtle}`,
              padding: '12px 0',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            {/*
              A link, not a button. These rows navigate to a real route, so a
              ticket had no address: it could not be opened in a new tab, copied,
              bookmarked or reached by anything that looks for one. They also
              carried no affordance at all - no chevron, no underline, no icon -
              so on a touch screen, where there is no cursor to change, nothing
              said they were interactive.

              The minimum height is on the link rather than the row because the
              link is the target: measured at 390, a one-line row was 145x24 and
              a two-line row 245x48, so whether the control met the 44px minimum
              depended on how long its subject happened to be.
            */}
            <Link
              to={routeTo.supportTicket(ticket.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 44,
                fontFamily: v.fontBody,
                fontSize: 14,
                color: v.ink,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                textAlign: 'left',
              }}
            >
              <span>{ticket.subject}</span>
              <LxIcon name="chevronRight" size={14} color={v.ink3} />
            </Link>
            <StatusChip label={statusLabel(ticket.status)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TicketForm({
  category,
  setCategory,
  values,
  setValues,
  verification,
  setVerification,
  verificationCategories,
  categories,
  categoriesLoading,
  categoriesError,
  isVerification,
  pendingVerification,
  alreadyVerified,
  fieldErrors,
  filledEvidence,
  evidenceRemaining,
  submitting,
  onSubmit,
  failureMessage,
}) {
  // Verification has its own slot, so it is offered only when that slot is free.
  const verificationBlocked = Boolean(pendingVerification) || alreadyVerified;
  const selectable = categories.filter(
    (row) => row.categoryKey !== VERIFICATION_KEY || !verificationBlocked
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      {failureMessage ? (
        <Notice tone="bad" role="alert">
          {failureMessage}
        </Notice>
      ) : null}

      <Field label="what is this about" htmlFor="support-category" error={fieldErrors.category}>
        <select
          id="support-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          style={inputStyle(Boolean(fieldErrors.category))}
          disabled={categoriesLoading}
          aria-invalid={Boolean(fieldErrors.category)}
        >
          <option value="">choose one</option>
          {selectable.map((row) => (
            <option key={row.categoryKey} value={row.categoryKey}>
              {row.displayName.toLowerCase()}
            </option>
          ))}
        </select>
        {categoriesError ? (
          <div
            role="alert"
            style={{ fontFamily: v.fontBody, fontSize: 12, color: v.errorText, marginTop: 5 }}
          >
            we could not load the list of topics. reload the page.
          </div>
        ) : null}
      </Field>

      {category ? (
        <p
          style={{
            fontFamily: v.fontBody,
            fontSize: 13,
            color: v.ink2,
            margin: '-8px 0 16px',
            lineHeight: 1.5,
          }}
        >
          {categories.find((row) => row.categoryKey === category)?.description}
        </p>
      ) : null}

      {isVerification ? (
        <VerificationFields
          verification={verification}
          setVerification={setVerification}
          verificationCategories={verificationCategories}
          fieldErrors={fieldErrors}
          filledEvidence={filledEvidence}
          evidenceRemaining={evidenceRemaining}
        />
      ) : null}

      {category && !isVerification ? (
        <>
          <Field label="summary" htmlFor="support-subject" error={fieldErrors.subject}>
            <input
              id="support-subject"
              value={values.subject}
              onChange={(event) => setValues((prev) => ({ ...prev, subject: event.target.value }))}
              style={inputStyle(Boolean(fieldErrors.subject))}
              aria-invalid={Boolean(fieldErrors.subject)}
            />
          </Field>

          <Field
            label="tell us more"
            htmlFor="support-body"
            error={fieldErrors.body}
            hint="one request and one reply, so include everything now."
          >
            <textarea
              id="support-body"
              rows={8}
              value={values.body}
              onChange={(event) => setValues((prev) => ({ ...prev, body: event.target.value }))}
              style={{ ...inputStyle(Boolean(fieldErrors.body)), resize: 'vertical' }}
              aria-invalid={Boolean(fieldErrors.body)}
            />
          </Field>
        </>
      ) : null}

      {category ? (
        <PrimaryButton disabled={submitting || (isVerification && evidenceRemaining > 0)}>
          {submitting ? 'sending' : 'send request'}
        </PrimaryButton>
      ) : null}
    </form>
  );
}

function VerificationFields({
  verification,
  setVerification,
  verificationCategories,
  fieldErrors,
  filledEvidence,
  evidenceRemaining,
}) {
  const set = (name) => (event) =>
    setVerification((prev) => ({ ...prev, [name]: event.target.value }));

  return (
    <>
      <Field
        label="the category you are known in"
        htmlFor="verification-category"
        error={fieldErrors.categoryKey}
      >
        <select
          id="verification-category"
          value={verification.categoryKey}
          onChange={set('categoryKey')}
          style={inputStyle(Boolean(fieldErrors.categoryKey))}
          aria-invalid={Boolean(fieldErrors.categoryKey)}
        >
          <option value="">choose one</option>
          {verificationCategories.map((row) => (
            <option key={row.categoryKey} value={row.categoryKey}>
              {row.displayName.toLowerCase()}
            </option>
          ))}
        </select>
        {verification.categoryKey ? (
          <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink2, marginTop: 5 }}>
            {
              verificationCategories.find((row) => row.categoryKey === verification.categoryKey)
                ?.covers
            }
          </div>
        ) : null}
      </Field>

      <Field
        label="the name you are known by"
        htmlFor="verification-name"
        error={fieldErrors.claimedName}
      >
        <input
          id="verification-name"
          value={verification.claimedName}
          onChange={set('claimedName')}
          style={inputStyle(Boolean(fieldErrors.claimedName))}
          aria-invalid={Boolean(fieldErrors.claimedName)}
        />
      </Field>

      <div
        style={{
          background: v.surface,
          border: `1px solid ${v.border}`,
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <Eyebrow>evidence</Eyebrow>
        <p style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2, margin: '0 0 12px' }}>
          fill at least {MIN_EVIDENCE_FIELDS} of these. the more you give, the faster a reviewer can
          decide.
        </p>

        {/* The requirement is stated before submission and counts down live, so a
            reviewer's floor is never discovered as a rejection afterwards. */}
        <div
          aria-live="polite"
          style={{
            fontFamily: v.fontBody,
            fontSize: 13,
            color: evidenceRemaining === 0 ? v.successText : v.ink2,
            marginBottom: 14,
          }}
        >
          {evidenceRemaining === 0
            ? `ready to send (${filledEvidence} of ${MIN_EVIDENCE_FIELDS})`
            : `fill ${evidenceRemaining} more evidence ${
                evidenceRemaining === 1 ? 'field' : 'fields'
              } to submit (${filledEvidence} of ${MIN_EVIDENCE_FIELDS})`}
        </div>

        {EVIDENCE_FIELDS.map((field) => (
          <Field key={field.name} label={field.label} htmlFor={`verification-${field.name}`}>
            {field.multiline ? (
              <textarea
                id={`verification-${field.name}`}
                rows={4}
                value={verification[field.name]}
                onChange={set(field.name)}
                style={{ ...inputStyle(false), resize: 'vertical' }}
              />
            ) : (
              <input
                id={`verification-${field.name}`}
                value={verification[field.name]}
                onChange={set(field.name)}
                style={inputStyle(false)}
              />
            )}
          </Field>
        ))}

        {fieldErrors.evidenceWebsite ? (
          <div role="alert" style={{ fontFamily: v.fontBody, fontSize: 12, color: v.errorText }}>
            {fieldErrors.evidenceWebsite}
          </div>
        ) : null}
      </div>
    </>
  );
}

export { VERIFICATION_CATEGORY };
export default HelpCenterScreen;
