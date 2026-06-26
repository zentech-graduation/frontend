import { useEffect, useMemo, useState } from 'react';
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
import { ROUTES } from '@/config/constants';
import { loginSchema } from '../utils/authSchemas';
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
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isReauthRequest = searchParams.get('reauth') === '1';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isReauthRequest) {
      return;
    }

    const clearExistingSession = async () => {
      try {
        await authApi.logout();
      } catch {
        // If the session is already gone server-side, we still want a clean local sign-in flow.
      } finally {
        logout();
      }
    };

    clearExistingSession();
  }, [isReauthRequest, logout]);

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

      const nextPath = location.state?.from?.pathname || ROUTES.APP;
      navigate(nextPath, { replace: true });
    } catch (error) {
      const errorCode = error?.response?.data?.errorCode;
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        navigate(ROUTES.VERIFY_EMAIL_NOTICE, {
          state: { email: values.email },
        });
        return;
      }
      logout();
      setServerError(authApi.normalizeMessage(error, 'Unable to sign you in right now.'));
    }
  };

  const handleGoogleLogin = () => {
    setServerError('');

    try {
      window.location.href = authApi.getGoogleLoginUrl();
    } catch (error) {
      setServerError(authApi.normalizeMessage(error, 'Unable to start Google sign in right now.'));
    }
  };

  return (
    <AuthPageLayout>
      <AuthShell
        title="welcome back."
        subtitle=""
        footer={
          <p>
            new here? <Link to={ROUTES.REGISTER}>create an account</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <GoogleButton
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            label="continue with Google"
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
            <Link to={ROUTES.FORGOT_PASSWORD}>forgot password?</Link>
          </div>

          {successMessage ? <AuthAlert tone="success">{successMessage}</AuthAlert> : null}
          {serverError ? <AuthAlert>{serverError}</AuthAlert> : null}

          <AuthButton type="submit" loading={isSubmitting}>
            sign in
          </AuthButton>
        </form>
      </AuthShell>
    </AuthPageLayout>
  );
}
