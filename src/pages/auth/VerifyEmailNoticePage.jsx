import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';

import { AuthAlert, AuthButton, AuthInput, AuthShell } from '@/components/auth/AuthPrimitives';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { ROUTES } from '@/config/constants';
import { useResendVerification } from '@/features/auth/hooks/useAuth';
import { emailSchema } from '@/features/auth/utils/authSchemas';

export default function VerifyEmailNoticePage() {
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  const [successMessage, setSuccessMessage] = useState('');
  const resendMutation = useResendVerification();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: emailFromState },
  });

  const onSubmit = (values) => {
    setSuccessMessage('');
    resendMutation.mutate(values, {
      onSuccess: () => {
        setSuccessMessage('If this email is registered, a new verification link has been sent.');
      },
    });
  };

  return (
    <AuthPageLayout>
      <AuthShell
        eyebrow="Verify your email"
        title="check your inbox."
        subtitle="We sent a verification link to your email address. Click the link to activate your account."
        footer={
          <p>
            Already verified? <Link to={ROUTES.LOGIN}>Sign in</Link>
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

          {resendMutation.error ? (
            <AuthAlert>{resendMutation.error.message}</AuthAlert>
          ) : null}
          {successMessage ? (
            <AuthAlert tone="success">{successMessage}</AuthAlert>
          ) : null}

          <AuthButton type="submit" loading={isSubmitting || resendMutation.isPending}>
            Resend verification email
          </AuthButton>
        </form>
      </AuthShell>
    </AuthPageLayout>
  );
}
