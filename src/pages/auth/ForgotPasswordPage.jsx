import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import { AuthAlert, AuthButton, AuthInput, AuthShell } from '@/components/auth/AuthPrimitives';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { emailSchema } from '@/features/auth/utils/authSchemas';

export default function ForgotPasswordPage() {
  const [requestState, setRequestState] = useState({ error: '', success: '' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values) => {
    setRequestState({ error: '', success: '' });

    try {
      await authApi.forgotPassword(values);
      setRequestState({
        error: '',
        success: `If an account exists for ${values.email}, a reset link is on the way.`,
      });
    } catch (error) {
      setRequestState({
        error: authApi.normalizeMessage(error, 'Unable to request a password reset right now.'),
        success: '',
      });
    }
  };

  return (
    <AuthPageLayout>
      <AuthShell
        eyebrow="Forgot password"
        title="reset your password."
        subtitle="Enter your email and we will send you a secure reset link."
        footer={
          <p>
            Remembered it? <Link to="/login">Back to sign in</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <AuthInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          {requestState.error ? <AuthAlert>{requestState.error}</AuthAlert> : null}
          {requestState.success ? (
            <AuthAlert tone="success">{requestState.success}</AuthAlert>
          ) : null}

          <AuthButton type="submit" loading={isSubmitting}>
            Send reset link
          </AuthButton>

        </form>
      </AuthShell>
    </AuthPageLayout>
  );
}
