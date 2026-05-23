import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import {
  AuthAlert,
  AuthButton,
  AuthDivider,
  AuthInput,
  AuthShell,
  GoogleButton,
  PasswordStrength,
  PasswordToggle,
  usePasswordToggle,
} from '@/components/auth/AuthPrimitives';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { registerSchema } from '@/features/auth/utils/authSchemas';

function buildUsername(name, email) {
  const baseSource = name?.trim() || email?.split('@')[0] || 'luvax-user';
  const normalized = baseSource
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.')
    .slice(0, 20);

  const safeBase = normalized || 'luvax.user';
  const uniqueSuffix = Date.now().toString().slice(-6);

  return `${safeBase}.${uniqueSuffix}`.slice(0, 30);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const passwordField = usePasswordToggle();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = useWatch({
    control,
    name: 'password',
  });
  const emailValue = watch('email');
  const normalizedError = serverError.toLowerCase();
  const accountExists = normalizedError.includes('already exists');

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate(`/verify-email?email=${encodeURIComponent(successMessage)}`, {
        replace: true,
        state: {
          registerSuccess: 'Registration successful. Please verify your email to continue.',
        },
      });
    }, 1200);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate, successMessage]);

  const onSubmit = async (values) => {
    setServerError('');
    setSuccessMessage('');

    try {
      await authApi.register({
        name: values.name,
        username: buildUsername(values.name, values.email),
        email: values.email,
        password: values.password,
      });

      setSuccessMessage(values.email);
    } catch (error) {
      setServerError(authApi.normalizeMessage(error, 'Unable to create your account right now.'));
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
        title="create your account."
        subtitle="a small social network for the people you actually know."
        footer={
          <p>
            already have one? <Link to="/login">sign in</Link>
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
            label="Display name"
            placeholder="Alex Morgan"
            error={errors.name?.message}
            {...register('name')}
          />
          <AuthInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="auth-form__stack">
            <AuthInput
              label="Password"
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
            label="Confirm password"
            type={passwordField.type}
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {serverError ? <AuthAlert>{serverError}</AuthAlert> : null}
          {successMessage ? (
            <AuthAlert tone="success">
              Your account has been created successfully. Redirecting to email verification...
            </AuthAlert>
          ) : null}

          {accountExists && emailValue?.trim() ? (
            <div className="auth-form__meta auth-form__meta--center">
              <span>This email may already be waiting for verification.</span>
              <Link to={`/verify-email?email=${encodeURIComponent(emailValue.trim().toLowerCase())}`}>
                Verify email
              </Link>
            </div>
          ) : null}

          <AuthButton type="submit" loading={isSubmitting}>
            create account
          </AuthButton>
        </form>
      </AuthShell>
    </AuthPageLayout>
  );
}
