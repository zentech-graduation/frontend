import { useEffect, useLayoutEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import Field from '@/features/auth/components/AuthField';
import '@/features/auth/components/AuthPage.css';
import { ROUTES } from '@/config/constants';
import { resetPasswordSchema } from '@/features/auth/utils/authSchemas';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPw, setShowPw] = useState(false);
  const [serverState, setServerState] = useState({ error: '', success: '' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Scrub the token query parameter from the URL immediately after the token
  // has been captured into the local const. useLayoutEffect runs synchronously
  // before paint so the token never appears in the rendered address bar.
  useLayoutEffect(() => {
    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!serverState.success) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: {
          resetSuccess:
            'Your password has been reset successfully. Sign in with your new password.',
        },
      });
    }, 1200);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate, serverState.success]);

  const onSubmit = async (values) => {
    setServerState({ error: '', success: '' });

    if (!token) {
      setServerState({ error: 'this link has expired. request a new one to continue.', success: '' });
      return;
    }

    try {
      await authApi.resetPassword({
        token,
        newPassword: values.password,
      });

      setServerState({
        error: '',
        success: 'your password is changed. taking you to sign in.',
      });
    } catch (error) {
      // A reset token that is expired, already used or malformed all answer
      // AUTH_RESET_TOKEN_INVALID, and that is the one case worth telling apart
      // here because the way out differs: a new link rather than another go.
      const code = error?.response?.data?.code;
      setServerState({
        error:
          code === 'AUTH_RESET_TOKEN_INVALID'
            ? 'this link has expired or has already been used. request a new one and it will work.'
            : "we couldn't change your password just now. try again in a moment.",
        success: '',
      });
    }
  };

  if (!token) {
    return (
      <div className="lx-shell">
        <div className="lx-col lx-enter">
          <div className="lx-card">
            <div className="lx-head">
              <h1 className="lx-h2">link expired.</h1>
              <p className="lx-sub">
                reset links stop working after fifteen minutes, and each one can only be used
                once. requesting a new one takes a moment.
              </p>
            </div>
            <div className="lx-foot-block">
              <Link to={ROUTES.FORGOT_PASSWORD}>request a new reset link</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lx-shell">
      <div className="lx-col lx-enter">
        <div className="lx-card">
          <div className="lx-head">
            <h1 className="lx-h2">choose a new password.</h1>
            <p className="lx-sub">create a strong password for your luvax account.</p>
          </div>

          <form
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <Field
              id="rp-pw"
              label="new password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.password?.message}
              register={register('password')}
              className="lx-field--pw"
              rightSlot={
                <button
                  type="button"
                  className="lx-pwtoggle"
                  onClick={() => setShowPw((shown) => !shown)}
                >
                  {showPw ? 'hide' : 'show'}
                </button>
              }
            />

            <Field
              id="rp-confirm-pw"
              label="confirm new password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              register={register('confirmPassword')}
            />

            {serverState.error ? (
              <p style={{ color: 'var(--lx-error-text)', fontSize: '14px', margin: 0 }}>
                {serverState.error}
              </p>
            ) : null}
            {serverState.success ? (
              <p style={{ color: 'var(--lx-success-text)', fontSize: '14px', margin: 0 }}>
                {serverState.success}
              </p>
            ) : null}

            <button type="submit" className="lx-btn-primary" disabled={isSubmitting}>
              reset password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
