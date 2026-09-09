import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v } from '@/config/tokens';
import { useCreateAppeal } from '../hooks/useSupport';
import { appealSchema } from '../utils/supportSchemas';
import { describeSupportError, isRateLimited, isTokenInvalid } from '../utils/supportErrors';
import { Eyebrow, Field, Notice, PrimaryButton, SupportPage } from './SupportPrimitives';
import { inputStyle } from './fieldStyles';

/**
 * The appeal form reached from the signed link in a moderation notice.
 *
 * This screen must work for a signed-out, banned account. It therefore reads
 * nothing from the auth store, calls no authenticated endpoint, and sits
 * outside `ProtectedRoute`. The account it is submitted for cannot authenticate
 * at all - `TokenPrincipalResolverImpl` admits only ACTIVE - which is the whole
 * reason this path exists.
 *
 * Redeeming the token creates exactly one ticket and mints no session: no
 * access token, no refresh token, no refresh_tokens row. Nothing here writes to
 * the auth store, so there is no client-side path to one either.
 *
 * The appealed category is carried by the token and resolved server-side. It is
 * deliberately not a field: a client-supplied category would let a submitter
 * appeal something the link never authorised.
 */
export function AppealLandingScreen() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(() => searchParams.get('token') ?? '');
  const [values, setValues] = useState({ subject: '', body: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const appeal = useCreateAppeal();

  // The token is a single-use credential. Taking it out of the address bar
  // keeps it out of history, out of a shared screenshot, and out of any
  // Referer header a later navigation would send.
  useEffect(() => {
    if (searchParams.get('token')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  if (!token) {
    return (
      <SupportPage
        title="this link is not complete"
        intro="the address is missing its token, so we cannot tell which decision you are appealing."
      >
        <Notice tone="bad" role="alert">
          open the link from the email again, in full. if you no longer have it, you can still reach
          us through the public form.
        </Notice>
        <a
          href="/support/new"
          style={{ fontFamily: v.fontBody, fontSize: 14, color: v.accentText }}
        >
          use the public form
        </a>
      </SupportPage>
    );
  }

  if (submitted) {
    return (
      <SupportPage
        title="your appeal is with us"
        intro="a member of staff will review it and reply to the address we hold for your account."
      >
        <Notice tone="good" role="status">
          this link has now been used and will not work again. you do not need to send it a second
          time.
        </Notice>
      </SupportPage>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setFailure('');
    const parsed = appealSchema.safeParse(values);
    if (!parsed.success) {
      const next = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0]] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    appeal.mutate(
      { token, subject: parsed.data.subject, body: parsed.data.body },
      {
        onSuccess: () => setSubmitted(true),
        onError: (error) => {
          if (isTokenInvalid(error)) {
            // Terminal. Clearing the token drops the form and shows the spent
            // state, rather than inviting a retry that can only fail again.
            setToken('');
            setFailure('');
            return;
          }
          setFailure(describeSupportError(error));
        },
      }
    );
  };

  const spent = isTokenInvalid(appeal.error);

  return (
    <SupportPage
      title="appeal a decision"
      intro="tell us why you think the decision on your account should be looked at again. one request, one reply."
    >
      {spent ? (
        <Notice tone="bad" role="alert">
          this link has already been used, or it has expired. each appeal link works once.
        </Notice>
      ) : null}

      {failure ? (
        <Notice tone="bad" role="alert">
          {failure}
        </Notice>
      ) : null}

      {isRateLimited(appeal.error) ? (
        <Notice tone="warn" role="alert">
          too many attempts from here. wait a little and try again.
        </Notice>
      ) : null}

      <div
        style={{
          background: v.surface,
          border: `1px solid ${v.border}`,
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 20,
        }}
      >
        <Eyebrow>what you are appealing</Eyebrow>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5 }}>
          the decision named in the email you followed this link from. we have matched it to that
          decision already, so you do not need to describe which one it was.
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="summary" htmlFor="appeal-subject" error={fieldErrors.subject}>
          <input
            id="appeal-subject"
            value={values.subject}
            onChange={(event) => setValues((prev) => ({ ...prev, subject: event.target.value }))}
            style={inputStyle(Boolean(fieldErrors.subject))}
            aria-invalid={Boolean(fieldErrors.subject)}
            aria-describedby={fieldErrors.subject ? 'appeal-subject-error' : undefined}
          />
        </Field>

        <Field
          label="why should this be reviewed"
          htmlFor="appeal-body"
          error={fieldErrors.body}
          hint="one request and one reply. there is no back and forth, so include everything now."
        >
          <textarea
            id="appeal-body"
            rows={8}
            value={values.body}
            onChange={(event) => setValues((prev) => ({ ...prev, body: event.target.value }))}
            style={{ ...inputStyle(Boolean(fieldErrors.body)), resize: 'vertical' }}
            aria-invalid={Boolean(fieldErrors.body)}
            aria-describedby={fieldErrors.body ? 'appeal-body-error' : 'appeal-body-hint'}
          />
        </Field>

        <PrimaryButton disabled={appeal.isPending}>
          {appeal.isPending ? 'sending' : 'send appeal'}
        </PrimaryButton>
      </form>
    </SupportPage>
  );
}

export default AppealLandingScreen;
