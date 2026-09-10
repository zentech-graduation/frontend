import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v } from '@/config/tokens';
import { useConfirmPublicTicket } from '../hooks/useSupport';
import { isTokenInvalid } from '../utils/supportErrors';
import { Notice, SupportPage } from './SupportPrimitives';

/**
 * Consumes the confirmation token from a public submission's email.
 *
 * Anonymous: the submitter may hold no account at all, which is the premise of
 * the public path.
 *
 * Three outcomes, kept distinct because they call for different actions. A
 * success needs nothing further. An expired or already-used link needs a fresh
 * submission. A transport failure is worth retrying, and the other two are not.
 *
 * The backend answers `SUPPORT_TOKEN_INVALID` for both spent and expired, since
 * the token is deleted on redemption and cannot be told apart afterwards
 * without keeping a record of every token ever issued. The copy therefore names
 * both possibilities rather than asserting one.
 */
export function ConfirmLandingScreen() {
  const [searchParams] = useSearchParams();
  const [token] = useState(() => searchParams.get('token') ?? '');
  const [outcome, setOutcome] = useState(token ? 'pending' : 'missing');
  const confirm = useConfirmPublicTicket();
  // React runs effects twice in development StrictMode. The token is
  // single-use, so a second call would consume it and report the first
  // redemption as an already-used link.
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) {
      return;
    }
    calledRef.current = true;
    window.history.replaceState({}, document.title, window.location.pathname);

    // mutateAsync, not mutate with per-call callbacks. Those callbacks belong to the observer, and
    // StrictMode tears the observer down and rebuilds it between the effect's cleanup and its
    // second run - so they were dropped, while calledRef correctly stopped a second request from
    // being sent. The result was that neither branch ever ran and the screen sat on its loading
    // state for ever, even though the server had already answered SUPPORT_TOKEN_INVALID. The
    // promise mutateAsync returns settles whatever the observer does.
    confirm
      .mutateAsync(token)
      .then(() => setOutcome('confirmed'))
      .catch((error) => setOutcome(isTokenInvalid(error) ? 'spent' : 'failed'));
    // The mutation object is recreated every render; depending on it would
    // re-run this effect and consume a second token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (outcome === 'missing') {
    return (
      <SupportPage
        title="this link is not complete"
        intro="the address is missing its token, so there is nothing to confirm."
      >
        <Notice tone="bad" role="alert">
          open the link from the email again, in full.
        </Notice>
      </SupportPage>
    );
  }

  if (outcome === 'pending') {
    return (
      <SupportPage title="confirming your email" intro="one moment.">
        <div
          className="lx-skeleton"
          style={{ height: 56, borderRadius: 12 }}
          role="status"
          aria-label="confirming your email"
        />
      </SupportPage>
    );
  }

  if (outcome === 'confirmed') {
    return (
      <SupportPage
        title="your request is with us"
        intro="your address is confirmed, so your request is now in front of our staff."
      >
        <Notice tone="good" role="status">
          we will reply to the address you gave. there is no need to send it again.
        </Notice>
      </SupportPage>
    );
  }

  if (outcome === 'spent') {
    return (
      <SupportPage
        title="this link has already been used"
        intro="each confirmation link works once, and expires if it is left too long."
      >
        <Notice tone="warn" role="alert">
          if you already confirmed, your request is with us and you do not need to do anything. if
          you are not sure it went through, send a new one.
        </Notice>
        <a
          href="/support/new"
          style={{ fontFamily: v.fontBody, fontSize: 14, color: v.accentText }}
        >
          send a new request
        </a>
      </SupportPage>
    );
  }

  return (
    <SupportPage
      title="we could not confirm that just now"
      intro="this looks like a connection problem rather than a problem with your link."
    >
      <Notice tone="bad" role="alert">
        reload this page to try again. your link has not been used.
      </Notice>
    </SupportPage>
  );
}

export default ConfirmLandingScreen;
