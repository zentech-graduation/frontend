import { useState } from 'react';
import { v } from '@/config/tokens';
import { useCreatePublicTicket, usePublicSupportCategories } from '../hooks/useSupport';
import { publicTicketSchema } from '../utils/supportSchemas';
import { describeSupportError, isCaptchaFailure, isRateLimited } from '../utils/supportErrors';
import { Field, Notice, PrimaryButton, SupportPage } from './SupportPrimitives';
import { inputStyle } from './fieldStyles';
import { TurnstileWidget } from './TurnstileWidget';

/**
 * The anonymous support form, for someone with no account or no session.
 *
 * Two independent controls stand behind it, both server-side: Turnstile, and an
 * email confirmation step. The ticket is written in `pending_confirmation` and
 * is invisible to every staff query until the confirmation link is followed, so
 * submitting here is not the same as being heard - the success copy says so
 * rather than implying the request is already in a queue.
 *
 * Appeal categories are refused on this path, and so is verification. Both are
 * excluded by the `allowsPublicForm` flag the endpoint filters on, so the
 * selector cannot offer one.
 */
export function PublicSupportFormScreen() {
  const categoriesQuery = usePublicSupportCategories();
  const submit = useCreatePublicTicket();
  const [values, setValues] = useState({
    contactEmail: '',
    category: '',
    subject: '',
    body: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [challengeUnavailable, setChallengeUnavailable] = useState('');
  const [sent, setSent] = useState(false);

  const categories = categoriesQuery.data ?? [];

  if (sent) {
    return (
      <SupportPage
        title="check your email"
        intro="we have sent a link to the address you gave. your request reaches our staff once you follow it."
      >
        <Notice tone="good" role="status">
          until then it is not visible to anyone. if the email does not arrive, check your spam
          folder before sending another.
        </Notice>
      </SupportPage>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = publicTicketSchema.safeParse(values);
    if (!parsed.success) {
      const next = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0]] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    submit.mutate({ ...parsed.data, turnstileToken }, { onSuccess: () => setSent(true) });
  };

  // A failed challenge is its own state, not a validation error: the form is
  // filled in correctly and the thing that refused is the bot control, so
  // saying "check your answers" would send the user hunting for a mistake that
  // is not there.
  const captchaRefused = isCaptchaFailure(submit.error);
  const rateLimited = isRateLimited(submit.error);
  const otherFailure =
    submit.isError && !captchaRefused && !rateLimited ? describeSupportError(submit.error) : '';

  return (
    <SupportPage
      title="contact support"
      intro="tell us what has happened and we will reply by email. one request, one reply."
    >
      {captchaRefused ? (
        <Notice tone="bad" role="alert">
          the challenge below was not accepted, so nothing was sent. complete it again and resend.
          your message is still here.
        </Notice>
      ) : null}

      {rateLimited ? (
        <Notice tone="warn" role="alert">
          too many requests have come from here recently. wait a while before sending another.
        </Notice>
      ) : null}

      {otherFailure ? (
        <Notice tone="bad" role="alert">
          {otherFailure}
        </Notice>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="your email"
          htmlFor="public-email"
          error={fieldErrors.contactEmail}
          hint="we send a confirmation link here first, then our reply."
        >
          <input
            id="public-email"
            type="email"
            autoComplete="email"
            value={values.contactEmail}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, contactEmail: event.target.value }))
            }
            style={inputStyle(Boolean(fieldErrors.contactEmail))}
            aria-invalid={Boolean(fieldErrors.contactEmail)}
            aria-describedby={fieldErrors.contactEmail ? 'public-email-error' : 'public-email-hint'}
          />
        </Field>

        <Field label="what is this about" htmlFor="public-category" error={fieldErrors.category}>
          <select
            id="public-category"
            value={values.category}
            onChange={(event) => setValues((prev) => ({ ...prev, category: event.target.value }))}
            style={inputStyle(Boolean(fieldErrors.category))}
            disabled={categoriesQuery.isLoading}
            aria-invalid={Boolean(fieldErrors.category)}
          >
            <option value="">choose one</option>
            {categories.map((category) => (
              <option key={category.categoryKey} value={category.categoryKey}>
                {category.displayName.toLowerCase()}
              </option>
            ))}
          </select>
          {categoriesQuery.isError ? (
            <div
              role="alert"
              style={{ fontFamily: v.fontBody, fontSize: 12, color: v.errorText, marginTop: 5 }}
            >
              we could not load the list of topics. reload the page.
            </div>
          ) : null}
        </Field>

        <Field label="summary" htmlFor="public-subject" error={fieldErrors.subject}>
          <input
            id="public-subject"
            value={values.subject}
            onChange={(event) => setValues((prev) => ({ ...prev, subject: event.target.value }))}
            style={inputStyle(Boolean(fieldErrors.subject))}
            aria-invalid={Boolean(fieldErrors.subject)}
          />
        </Field>

        <Field
          label="what happened"
          htmlFor="public-body"
          error={fieldErrors.body}
          hint="there is no back and forth, so include everything now."
        >
          <textarea
            id="public-body"
            rows={8}
            value={values.body}
            onChange={(event) => setValues((prev) => ({ ...prev, body: event.target.value }))}
            style={{ ...inputStyle(Boolean(fieldErrors.body)), resize: 'vertical' }}
            aria-invalid={Boolean(fieldErrors.body)}
          />
        </Field>

        <TurnstileWidget onToken={setTurnstileToken} onUnavailable={setChallengeUnavailable} />

        <PrimaryButton
          disabled={submit.isPending || !turnstileToken || Boolean(challengeUnavailable)}
        >
          {submit.isPending ? 'sending' : 'send request'}
        </PrimaryButton>

        {!turnstileToken && !challengeUnavailable ? (
          <div
            style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink2, marginTop: 8 }}
            aria-live="polite"
          >
            complete the challenge above to send.
          </div>
        ) : null}
      </form>
    </SupportPage>
  );
}

export default PublicSupportFormScreen;
