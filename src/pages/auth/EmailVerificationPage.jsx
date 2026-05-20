import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import { AuthAlert, AuthShell, InlineAction } from '@/components/auth/AuthPrimitives';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { useCountdown } from '@/hooks/useCountdown';

const RESEND_SECONDS = 60;

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';
  const [resendState, setResendState] = useState({ error: '', success: '' });
  const [tokenError, setTokenError] = useState('');
  const { secondsLeft: countdown, isComplete: canResend, start: restartCountdown } =
    useCountdown(RESEND_SECONDS);

  useEffect(() => {
    if (!tokenFromUrl) {
      return;
    }

    const verifyFromUrl = async () => {
      try {
        await authApi.verifyEmail({
          token: tokenFromUrl,
        });

        navigate('/login', {
          replace: true,
          state: {
            verificationSuccess: true,
          },
        });
      } catch (error) {
        setTokenError(
          authApi.normalizeMessage(error, 'The verification link is invalid or has expired.')
        );
      }
    };

    verifyFromUrl();
  }, [navigate, tokenFromUrl]);

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
            ? `Vui long xac thuc email cua ban: ${email}.`
            : 'Vui long xac thuc email cua ban de tiep tuc su dung Luvax.'
        }
        footer={
          <p>
            Already verified? <Link to="/login">Sign in</Link>
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
