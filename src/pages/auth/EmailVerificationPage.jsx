import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import { AuthAlert, AuthShell, InlineAction } from '@/components/auth/AuthPrimitives';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
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
  const { secondsLeft: countdown, isComplete: canResend, start: restartCountdown } =
    useCountdown(RESEND_SECONDS);

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
        error: authApi.normalizeMessage(error, 'Unable to resend the verification email right now.'),
        success: '',
      });
    }
  };

  return (
    <AuthPageLayout>
      <AuthShell
        eyebrow="Verify email"
        title="verify your email."
        subtitle={
          email
            ? `We sent a verification link to ${email}.`
            : 'Check your inbox for a verification link.'
        }
        footer={
          <p>
            Already verified? <Link to={ROUTES.LOGIN}>Sign in</Link>
          </p>
        }
      >
        <div className="auth-form">
          {tokenError ? <AuthAlert>{tokenError}</AuthAlert> : null}
          {resendState.error ? <AuthAlert>{resendState.error}</AuthAlert> : null}
          {resendState.success ? <AuthAlert tone="success">{resendState.success}</AuthAlert> : null}

          <div className="auth-form__meta auth-form__meta--center">
            <span>Didn&apos;t receive the email?</span>
            <InlineAction onClick={handleResend} disabled={!canResend || !email}>
              {canResend ? 'Resend email' : `Resend in ${countdown}s`}
            </InlineAction>
          </div>
        </div>
      </AuthShell>
    </AuthPageLayout>
  );
}
