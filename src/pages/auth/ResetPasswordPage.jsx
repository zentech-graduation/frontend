import { useEffect, useLayoutEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthShell,
  PasswordStrength,
  PasswordToggle,
  usePasswordToggle,
} from '@/components/auth/AuthPrimitives';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { resetPasswordSchema } from '@/features/auth/utils/authSchemas';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const passwordField = usePasswordToggle();
  const [serverState, setServerState] = useState({ error: '', success: '' });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = useWatch({
    control,
    name: 'password',
  });

  // Scrub the token query parameter from the URL immediately after the token
  // has been captured into defaultValues. useLayoutEffect runs synchronously
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
      navigate('/login', {
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

    try {
      await authApi.resetPassword({
        token: values.token,
        newPassword: values.password,
      });

      setServerState({
        error: '',
        success: 'Your password has been updated. Redirecting to sign in...',
      });
    } catch (error) {
      setServerState({
        error: authApi.normalizeMessage(error, 'Unable to reset your password right now.'),
        success: '',
      });
    }
  };

  return (
    <AuthPageLayout>
      <AuthShell
        eyebrow="Reset password"
        title="choose a new password."
        subtitle="Create a strong password for your Luvax account."
        footer={
          <p>
            Need a new link? <Link to="/forgot-password">Request another reset email</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <AuthInput
            label="Reset code or token"
            type="text"
            placeholder="Paste the code from your email"
            autoComplete="one-time-code"
            error={errors.token?.message}
            {...register('token')}
          />

          <div className="auth-form__stack">
            <AuthInput
              label="New password"
              type={passwordField.type}
              placeholder="Use a strong password"
              autoComplete="new-password"
              error={errors.password?.message}
              rightSlot={
                <PasswordToggle shown={passwordField.shown} onToggle={passwordField.toggle} />
              }
              {...register('password')}
            />
            <PasswordStrength password={passwordValue} />
          </div>

          <AuthInput
            label="Confirm new password"
            type={passwordField.type}
            placeholder="Repeat your new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {serverState.error ? <AuthAlert>{serverState.error}</AuthAlert> : null}
          {serverState.success ? <AuthAlert tone="success">{serverState.success}</AuthAlert> : null}

          <AuthButton type="submit" loading={isSubmitting}>
            Reset password
          </AuthButton>
        </form>
      </AuthShell>
    </AuthPageLayout>
  );
}
