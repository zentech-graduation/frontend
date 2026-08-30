import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { OpenTicketPanel } from '../components/OpenTicketPanel';
import { SupportLayout } from '../components/SupportLayout';
import { TicketForm } from '../components/TicketForm';
import { useTurnstile } from '../hooks/useTurnstile';
import {
  useConfirmPublicTicket,
  useCreateAppeal,
  useCreatePublicTicket,
  useOwnTicket,
  useSupportCategories,
  useUnsubscribe,
} from '../hooks/useSupport';
import { appealSchema, publicTicketSchema, toFieldErrors } from '../utils/supportSchemas';

/** One of the caller's own tickets, with the staff reply once there is one. */
export function SupportTicketScreen() {
  const { ticketId } = useParams();
  const ticket = useOwnTicket(ticketId);

  return (
    <SupportLayout title="Your request" subtitle="Everything we have on this request.">
      {ticket.isLoading ? <div className="lx-support__card">Loading.</div> : null}
      {ticket.isError ? (
        <div className="lx-support__notice lx-support__notice--error">
          {ticket.error?.message ?? 'We could not find that request.'}
        </div>
      ) : null}
      {ticket.data ? <OpenTicketPanel ticket={ticket.data} /> : null}
    </SupportLayout>
  );
}

/**
 * The appeal landing page, reached from the single-use link in a moderation
 * notice.
 *
 * Anonymous by necessity. The account this serves is banned or suspended, and
 * the backend admits only active accounts to any authenticated endpoint, so this
 * screen never touches the auth store, never sits behind a guard and never calls
 * an authenticated endpoint. Redeeming the token creates one ticket and mints no
 * session.
 *
 * There is no category control: the category travels inside the token, and
 * offering a choice would let the submitter appeal something it never
 * authorised.
 *
 * The panel below is deliberately generic about which action is being appealed.
 * The backend exposes nothing about a token before it is redeemed, and adding a
 * lookup would mean a pre-redemption endpoint that reveals moderation detail to
 * anyone holding a URL.
 */
export function SupportAppealScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [draft, setDraft] = useState({ subject: '', body: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const createAppeal = useCreateAppeal();

  if (!token) {
    return (
      <SupportLayout title="This link is incomplete">
        <div className="lx-support__notice lx-support__notice--error">
          This appeal link is missing its token. Open the link from your email exactly as it was
          sent, without editing the address.
        </div>
      </SupportLayout>
    );
  }

  if (createAppeal.isSuccess) {
    return (
      <SupportLayout title="Appeal received">
        <div className="lx-support__notice lx-support__notice--success">
          We have your appeal and will reply to the email address on your account. This link has now
          been used and will not work again.
        </div>
      </SupportLayout>
    );
  }

  const submit = () => {
    const parsed = appealSchema.safeParse(draft);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    createAppeal.mutate({ token, ...parsed.data });
  };

  return (
    <SupportLayout
      title="Contest this decision"
      subtitle="You do not need to sign in. This link works once."
    >
      <div className="lx-support__notice">
        You are appealing a recent decision about your account. Tell us why you think it should be
        reviewed and our team will look at it again.
      </div>
      {createAppeal.isError ? (
        <div className="lx-support__notice lx-support__notice--error">
          {createAppeal.error?.message ??
            'We could not accept that. The link may have expired or already been used.'}
        </div>
      ) : null}
      <TicketForm
        subject={draft.subject}
        body={draft.body}
        errors={fieldErrors}
        disabled={createAppeal.isPending}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        categorySlot={null}
      />
      <div className="lx-support__actions">
        <button
          type="button"
          className="lx-support__button lx-support__button--primary"
          disabled={createAppeal.isPending}
          onClick={submit}
        >
          {createAppeal.isPending ? 'Sending' : 'Send appeal'}
        </button>
      </div>
    </SupportLayout>
  );
}

/**
 * The public form, for someone with no session and possibly no account.
 *
 * Two independent controls, both required by the backend: a Turnstile token and
 * an email confirmation step. Nothing reaches staff until the confirmation link
 * is followed, so the success state promises an email rather than a ticket.
 */
export function SupportPublicScreen() {
  const containerRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
  const { token: turnstileToken, reset: resetTurnstile } = useTurnstile(containerRef, { siteKey });
  const categories = useSupportCategories();
  const createPublic = useCreatePublicTicket();
  const [draft, setDraft] = useState({ contactEmail: '', category: '', subject: '', body: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const selectable = (categories.data ?? []).filter(
    (category) => category.isEnabled && category.allowsPublicForm
  );

  // A rejected challenge must be re-solved, so the widget is reset on failure
  // rather than leaving a spent token in place for the next attempt.
  useEffect(() => {
    if (createPublic.isError) {
      resetTurnstile();
    }
  }, [createPublic.isError, resetTurnstile]);

  if (createPublic.isSuccess) {
    return (
      <SupportLayout title="Check your email">
        <div className="lx-support__notice lx-support__notice--success">
          We have sent a confirmation link to <strong>{draft.contactEmail}</strong>. Follow it and
          your request reaches our team. Nothing is sent to them until you do.
        </div>
      </SupportLayout>
    );
  }

  const submit = () => {
    const parsed = publicTicketSchema.safeParse({
      ...draft,
      category: draft.category || selectable[0]?.categoryKey || '',
      turnstileToken,
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    createPublic.mutate(parsed.data);
  };

  // A failed challenge is a different problem from a malformed form and needs a
  // different instruction: retry the challenge, rather than fix your input.
  const captchaFailed = createPublic.error?.code === 'SUPPORT_CAPTCHA_FAILED';
  const rateLimited =
    createPublic.error?.status === 429 ||
    createPublic.error?.code === 'SUPPORT_DAILY_LIMIT_REACHED';

  return (
    <SupportLayout
      title="Contact support"
      subtitle="For anyone who cannot sign in. We will reply to the address you give us."
    >
      {createPublic.isError ? (
        <div className="lx-support__notice lx-support__notice--error">
          {captchaFailed
            ? 'The verification challenge was not accepted. Solve it again and resend.'
            : rateLimited
              ? 'Too many requests from here recently. Try again later.'
              : (createPublic.error?.message ?? 'We could not send that. Try again shortly.')}
        </div>
      ) : null}

      <div className="lx-support__card">
        <div className="lx-support__field">
          <label className="lx-support__label" htmlFor="public-email">
            Your email address
          </label>
          <input
            id="public-email"
            type="email"
            className="lx-support__control"
            value={draft.contactEmail}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, contactEmail: event.target.value }))
            }
          />
          {fieldErrors.contactEmail ? (
            <p className="lx-support__error">{fieldErrors.contactEmail}</p>
          ) : (
            <p className="lx-support__hint">
              We send a confirmation link here before anything else.
            </p>
          )}
        </div>
      </div>

      <TicketForm
        subject={draft.subject}
        body={draft.body}
        errors={fieldErrors}
        disabled={createPublic.isPending}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        categorySlot={
          <div className="lx-support__field">
            <label className="lx-support__label" htmlFor="public-category">
              What is this about
            </label>
            <select
              id="public-category"
              className="lx-support__control"
              value={draft.category || selectable[0]?.categoryKey || ''}
              disabled={categories.isLoading || createPublic.isPending}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
            >
              {selectable.map((category) => (
                <option key={category.categoryKey} value={category.categoryKey}>
                  {category.displayName}
                </option>
              ))}
            </select>
            <p className="lx-support__hint">
              Appealing a ban or a removal? Use the link in the email we sent you instead.
            </p>
          </div>
        }
      />

      <div className="lx-support__card">
        <p className="lx-support__label">Verification</p>
        <div ref={containerRef} style={{ marginTop: '8px' }} />
        {fieldErrors.turnstileToken ? (
          <p className="lx-support__error">{fieldErrors.turnstileToken}</p>
        ) : null}
        {!siteKey ? (
          <p className="lx-support__error">
            Verification is not configured. Set VITE_TURNSTILE_SITE_KEY.
          </p>
        ) : null}
      </div>

      <div className="lx-support__actions">
        <button
          type="button"
          className="lx-support__button lx-support__button--primary"
          disabled={createPublic.isPending}
          onClick={submit}
        >
          {createPublic.isPending ? 'Sending' : 'Send request'}
        </button>
      </div>
    </SupportLayout>
  );
}

/** Consumes the confirmation token from a public submission. */
export function SupportConfirmScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const confirm = useConfirmPublicTicket();
  const firedRef = useRef(false);

  useEffect(() => {
    if (token && !firedRef.current) {
      firedRef.current = true;
      confirm.mutate(token);
    }
  }, [token, confirm]);

  return (
    <SupportLayout title="Confirm your request">
      {!token ? (
        <div className="lx-support__notice lx-support__notice--error">
          This link is missing its token.
        </div>
      ) : confirm.isPending ? (
        <div className="lx-support__card">Confirming.</div>
      ) : confirm.isSuccess ? (
        <div className="lx-support__notice lx-support__notice--success">
          Confirmed. Your request is with our team and we will reply by email.
        </div>
      ) : confirm.isError ? (
        <div className="lx-support__notice lx-support__notice--error">
          This link has expired or has already been used. Send a new request and we will email you a
          fresh link.
        </div>
      ) : null}
    </SupportLayout>
  );
}

/** Campaign mail opt-out, followed from a mail client with no session. */
export function SupportUnsubscribeScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const unsubscribe = useUnsubscribe();
  const firedRef = useRef(false);

  useEffect(() => {
    if (token && !firedRef.current) {
      firedRef.current = true;
      unsubscribe.mutate(token);
    }
  }, [token, unsubscribe]);

  return (
    <SupportLayout title="Unsubscribe">
      {!token ? (
        <div className="lx-support__notice lx-support__notice--error">
          This link is missing its token.
        </div>
      ) : unsubscribe.isPending ? (
        <div className="lx-support__card">Updating your preferences.</div>
      ) : unsubscribe.isSuccess ? (
        <div className="lx-support__notice lx-support__notice--success">
          You will not receive campaign emails from us again. Account and security emails, including
          anything about moderation of your account, are not affected.
        </div>
      ) : unsubscribe.isError ? (
        <div className="lx-support__notice lx-support__notice--error">
          This unsubscribe link is not valid. It may have been replaced by a newer one.
        </div>
      ) : null}
    </SupportLayout>
  );
}
