import { useState } from 'react';
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
import { ROUTES } from '@/config/constants';
import { registerSchema } from '@/features/auth/utils/authSchemas';

export default function RegisterPage() {
  const navigate = useNavigate();
  const passwordField = usePasswordToggle();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
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

  const onSubmit = async (values) => {
    setServerError('');

    try {
      await authApi.register({
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
      });

      navigate(ROUTES.VERIFY_EMAIL_NOTICE, { replace: true });
    } catch (error) {
      setServerError(authApi.normalizeMessage(error, 'Unable to create your account right now.'));
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
        title="create your account."
        subtitle="a small social network for the people you actually know."
        footer={
          <p>
            already have one? <Link to={ROUTES.LOGIN}>sign in</Link>
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
            label="Username"
            placeholder="yourname"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username')}
          />
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

          <AuthButton type="submit" loading={isSubmitting}>
            create account
          </AuthButton>
        </form>
      </AuthShell>
    </AuthPageLayout>
  );
}
