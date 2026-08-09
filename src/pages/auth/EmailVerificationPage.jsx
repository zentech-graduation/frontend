import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import '@/features/auth/components/AuthPage.css';
import { ROUTES } from '@/config/constants';
import { useCountdown } from '@/hooks/useCountdown';
import { useAuthStore } from '@/store/useAuthStore';

const RESEND_SECONDS = 60;

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';
  const [resendState, setResendState] = useState({ error: '', success: '' });
  const [tokenError, setTokenError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const {
    secondsLeft: countdown,
    isComplete: canResend,
    start: restartCountdown,
  } = useCountdown(RESEND_SECONDS);

  const calledRef = useRef(false);

  useEffect(() => {
    if (!tokenFromUrl || calledRef.current) {
      return;
    }
    calledRef.current = true;

    const verifyFromUrl = async () => {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + (email ? `?email=${encodeURIComponent(email)}` : '')
      );

      try {
        const sessionData = await authApi.verifyEmail({ token: tokenFromUrl });

        if (sessionData?.accessToken) {
          setAuth({
            accessToken: sessionData.accessToken,
            refreshToken: sessionData.refreshToken ?? null,
            user: sessionData.user ?? null,
          });
          navigate(ROUTES.APP, { replace: true });
        } else {
          navigate(ROUTES.LOGIN, {
            replace: true,
            state: { verificationSuccess: 'Your email has been verified. Sign in to continue.' },
          });
        }
      } catch (error) {
        setTokenError(
          authApi.normalizeMessage(error, 'The verification link is invalid or has expired.')
        );
      }
    };

    verifyFromUrl();
  }, [navigate, tokenFromUrl, email, setAuth]);

  const handleResend = async () => {
    if (!canResend || !email) {
      return;
    }

    setResendState({ error: '', success: '' });

    try {
      await authApi.resendVerification({ email });
      restartCountdown();
      setResendState({
        error: '',
        success: 'A new verification email has been sent.',
      });
    } catch (error) {
      setResendState({
        error: authApi.normalizeMessage(
          error,
          'Unable to resend the verification email right now.'
        ),
        success: '',
      });
    }
  };

  return (
    <div className="lx-shell">
      <div className="lx-col lx-enter">
        <div className="lx-card">
          <div className="lx-head">
            <h1 className="lx-h2">verify your email.</h1>
            <p className="lx-sub">
              {email
                ? `we sent a verification link to ${email}.`
                : 'check your inbox for a verification link.'}
            </p>
          </div>

          {tokenError ? (
            <p style={{ color: 'var(--lx-error-text)', fontSize: '14px', margin: 0 }}>
              {tokenError}
            </p>
          ) : null}
          {resendState.error ? (
            <p style={{ color: 'var(--lx-error-text)', fontSize: '14px', margin: 0 }}>
              {resendState.error}
            </p>
          ) : null}
          {resendState.success ? (
            <p style={{ color: 'var(--lx-success-text)', fontSize: '14px', margin: 0 }}>
              {resendState.success}
            </p>
          ) : null}

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}
          >
            <p style={{ fontSize: '14px', color: 'var(--lx-ink-2)', margin: 0 }}>
              didn&apos;t receive the email?
            </p>
            <button
              type="button"
              className="lx-btn-primary"
              onClick={handleResend}
              disabled={!canResend || !email}
            >
              {canResend ? 'resend email' : `resend in ${countdown}s`}
            </button>
          </div>

          <Link className="lx-linkbtn" to={ROUTES.LOGIN}>
            back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
