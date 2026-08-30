import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { SupportLayout, WireNote } from '../components/SupportLayout';
import { OpenTicketPanel } from '../components/OpenTicketPanel';
import { TicketForm } from '../components/TicketForm';
import {
  WIRE_ANSWERED_TICKET,
  WIRE_APPEAL_CONTEXT,
  WIRE_CATEGORIES,
  WIRE_OPEN_TICKET,
} from '../utils/wireframeFixtures';

/**
 * The remaining help centre screens, held in one module for the wireframe stage.
 *
 * Phase two splits these into a file each alongside SupportHomeScreen. Keeping
 * them together while the shapes are still being agreed means a layout decision
 * changes in one place rather than four.
 */

/** One of the caller's own tickets, with the staff reply once there is one. */
export function SupportTicketScreen() {
  const [answered, setAnswered] = useState(true);
  return (
    <SupportLayout title="Your request" subtitle="Everything we have on this request.">
      <OpenTicketPanel ticket={answered ? WIRE_ANSWERED_TICKET : WIRE_OPEN_TICKET} />
      <WireNote>
        <strong>Wireframe.</strong> The reply is stubbed.{' '}
        <button type="button" className="lx-support__button" onClick={() => setAnswered((v) => !v)}>
          {answered ? 'Show it awaiting a reply' : 'Show it answered'}
        </button>
      </WireNote>
    </SupportLayout>
  );
}

/**
 * The appeal landing page, reached from the single-use link in a moderation
 * notice.
 *
 * Anonymous by necessity. The account this serves is banned or suspended, and
 * the backend admits only active accounts to any authenticated endpoint, so this
 * screen must never touch the auth store, never sit behind a guard and never
 * call an authenticated endpoint. Redeeming the token creates one ticket and
 * mints no session, which is the property phase three verifies in the browser.
 *
 * There is no category control at all: the category is fixed by the token, and
 * offering a choice would let the submitter appeal something it never
 * authorised.
 */
export function SupportAppealScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [draft, setDraft] = useState({ subject: '', body: '' });

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

  return (
    <SupportLayout
      title="Contest this decision"
      subtitle="You do not need to sign in. This link works once."
    >
      <div className="lx-support__notice">
        <strong>{WIRE_APPEAL_CONTEXT.actionLabel}</strong> on{' '}
        {new Date(WIRE_APPEAL_CONTEXT.occurredAt).toLocaleDateString()}. You are appealing under{' '}
        {WIRE_APPEAL_CONTEXT.categoryLabel}.
      </div>
      <TicketForm
        subject={draft.subject}
        body={draft.body}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        categorySlot={null}
      />
      <div className="lx-support__actions">
        <button type="button" className="lx-support__button lx-support__button--primary">
          Send appeal
        </button>
      </div>
      <WireNote>
        <strong>Wireframe.</strong> The action being appealed is stubbed. Open question for review:
        the backend does not expose what a token refers to before it is redeemed, so this panel
        either stays generic or the backend gains a read-only lookup.
      </WireNote>
    </SupportLayout>
  );
}

/**
 * The public form, for someone with no session and possibly no account.
 *
 * Two independent controls, both required by the backend: a Turnstile token and
 * an email confirmation step. Nothing reaches staff until the confirmation link
 * is followed, so the success state promises an email rather than a ticket.
 *
 * Appeal categories are absent on purpose; the backend refuses them here.
 */
export function SupportPublicScreen() {
  const [draft, setDraft] = useState({
    email: '',
    category: 'account_access',
    subject: '',
    body: '',
  });
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <SupportLayout title="Check your email">
        <div className="lx-support__notice lx-support__notice--success">
          We have sent a confirmation link to <strong>{draft.email || 'your address'}</strong>.
          Follow it and your request reaches our team. Nothing is sent to them until you do.
        </div>
        <WireNote>
          <strong>Wireframe.</strong>{' '}
          <button type="button" className="lx-support__button" onClick={() => setSubmitted(false)}>
            Back to the form
          </button>
        </WireNote>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout
      title="Contact support"
      subtitle="For anyone who cannot sign in. We will reply to the address you give us."
    >
      <div className="lx-support__card">
        <div className="lx-support__field">
          <label className="lx-support__label" htmlFor="public-email">
            Your email address
          </label>
          <input
            id="public-email"
            type="email"
            className="lx-support__control"
            value={draft.email}
            onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
          />
          <p className="lx-support__hint">We send a confirmation link here before anything else.</p>
        </div>
      </div>
      <TicketForm
        subject={draft.subject}
        body={draft.body}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        categorySlot={
          <div className="lx-support__field">
            <label className="lx-support__label" htmlFor="public-category">
              What is this about
            </label>
            <select
              id="public-category"
              className="lx-support__control"
              value={draft.category}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
            >
              {WIRE_CATEGORIES.filter((category) => category.allowsPublicForm).map((category) => (
                <option key={category.key} value={category.key}>
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
        <div className="lx-support__wire" style={{ textAlign: 'center', marginTop: '8px' }}>
          Cloudflare Turnstile widget mounts here
        </div>
        <p className="lx-support__hint" style={{ marginTop: '8px' }}>
          The script loads only on this route.
        </p>
      </div>
      <div className="lx-support__actions">
        <button
          type="button"
          className="lx-support__button lx-support__button--primary"
          onClick={() => setSubmitted(true)}
        >
          Send request
        </button>
      </div>
      <WireNote>
        <strong>Wireframe.</strong> The widget is a placeholder; phase two loads the real script
        lazily against VITE_TURNSTILE_SITE_KEY. Verification failure gets its own message, distinct
        from a validation error, because the backend fails closed and the user needs to be told to
        retry rather than to fix their input.
      </WireNote>
    </SupportLayout>
  );
}

/** Consumes the confirmation token from a public submission. */
export function SupportConfirmScreen() {
  const [searchParams] = useSearchParams();
  const [outcome, setOutcome] = useState('success');
  const token = searchParams.get('token');

  return (
    <SupportLayout title="Confirm your request">
      {!token ? (
        <div className="lx-support__notice lx-support__notice--error">
          This link is missing its token.
        </div>
      ) : outcome === 'success' ? (
        <div className="lx-support__notice lx-support__notice--success">
          Confirmed. Your request is with our team and we will reply by email.
        </div>
      ) : (
        <div className="lx-support__notice lx-support__notice--error">
          This link has expired or has already been used. Send a new request and we will email you a
          fresh link.
        </div>
      )}
      <WireNote>
        <strong>Wireframe.</strong> A used or expired token gets its own message rather than a
        generic failure, because the two lead to different next actions.{' '}
        <button
          type="button"
          className="lx-support__button"
          onClick={() => setOutcome((v) => (v === 'success' ? 'expired' : 'success'))}
        >
          Show the other outcome
        </button>
      </WireNote>
    </SupportLayout>
  );
}

/** Campaign mail opt-out, followed from a mail client with no session. */
export function SupportUnsubscribeScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <SupportLayout title="Unsubscribed">
      {token ? (
        <div className="lx-support__notice lx-support__notice--success">
          You will not receive campaign emails from us again. Account and security emails, including
          anything about moderation of your account, are not affected.
        </div>
      ) : (
        <div className="lx-support__notice lx-support__notice--error">
          This link is missing its token.
        </div>
      )}
      <WireNote>
        <strong>Wireframe.</strong> The second sentence is load-bearing: opting out must not leave
        someone believing they have switched off their own password resets.
      </WireNote>
    </SupportLayout>
  );
}
