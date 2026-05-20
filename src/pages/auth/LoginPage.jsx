import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import {
  AuthAlert,
  AuthButton,
  AuthDivider,
  AuthInput,
  AuthShell,
  GoogleButton,
  PasswordToggle,
  usePasswordToggle,
} from '@/components/auth/AuthPrimitives';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { loginSchema } from '@/components/auth/authSchemas';
import { useAuthStore } from '@/store/useAuthStore';

const getSuccessMessage = (state) => {
  if (typeof state?.registerSuccess === 'string') return state.registerSuccess;
  if (typeof state?.verificationSuccess === 'string') return state.verificationSuccess;
  if (state?.verificationSuccess) return 'Your email has been verified. You can sign in now.';
  if (typeof state?.resetSuccess === 'string') return state.resetSuccess;
  if (state?.resetSuccess)
    return 'Your password has been reset successfully. Sign in with your new password.';
  return '';
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const passwordField = usePasswordToggle();
  const [serverError, setServerError] = useState('');
  const successMessage = getSuccessMessage(location.state);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const emailValue = watch('email');

  const canVerify = serverError.toLowerCase().includes('inactive') && emailValue?.trim();

  const onSubmit = async (values) => {
    setServerError('');

    try {
      const result = await authApi.login(values);
      const { accessToken, refreshToken } = result;

      if (!accessToken) {
        throw new Error('The login response did not return an access token.');
      }

      const user = result.user || (await authApi.getCurrentUser());

      setAuth({ accessToken, refreshToken, user });

      const nextPath = location.state?.from?.pathname || '/';
      navigate(nextPath, { replace: true });
    } catch (error) {
      logout();
      setServerError(authApi.normalizeMessage(error, 'Unable to sign you in right now.'));
    }
  };

  const handleGoogleLogin = () => {
    setServerError('');

    try {
      window.location.href = authApi.getGoogleLoginUrl();
    } catch (error) {
      setServerError(authApi.normalizeMessage(error, 'Google OAuth is not configured yet.'));
    }
  };

  return (
    <AuthPageLayout>
      <AuthShell
        eyebrow="Sign in"
        title="welcome back."
        subtitle="Step into Luvax with your email and password."
        footer={
          <p>
            New here? <Link to="/register">Create an account</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <GoogleButton
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            label="Login with Google"
          />
          <AuthDivider />

          <AuthInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthInput
            label="Password"
            type={passwordField.type}
            placeholder="At least 8 characters"
            autoComplete="current-password"
            error={errors.password?.message}
            rightSlot={
              <PasswordToggle shown={passwordField.shown} onToggle={passwordField.toggle} />
            }
            {...register('password')}
          />

          <div className="auth-form__meta auth-form__meta--end">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {successMessage ? <AuthAlert tone="success">{successMessage}</AuthAlert> : null}
          {serverError ? <AuthAlert>{serverError}</AuthAlert> : null}

          {canVerify ? (
            <div className="auth-form__meta auth-form__meta--center">
              <span>Your account still needs verification.</span>
              <Link to={`/verify-email?email=${encodeURIComponent(emailValue.trim().toLowerCase())}`}>
                Verify email
              </Link>
            </div>
          ) : null}

          <AuthButton type="submit" loading={isSubmitting}>
            Sign in
          </AuthButton>
        </form>
      </AuthShell>
    </AuthPageLayout>
  );
}
