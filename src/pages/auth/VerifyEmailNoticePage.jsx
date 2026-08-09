import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';

import Field from '@/features/auth/components/AuthField';
import '@/features/auth/components/AuthPage.css';
import { ROUTES } from '@/config/constants';
import authService from '@/features/auth/services/authService';
import { emailSchema } from '@/features/auth/utils/authSchemas';

export default function VerifyEmailNoticePage() {
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  const [successMessage, setSuccessMessage] = useState('');
  const resendMutation = useMutation({
    mutationFn: (data) => authService.resendVerification(data),
  });

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
    <div className="lx-shell">
      <div className="lx-col lx-enter">
        <div className="lx-card">
          <div className="lx-head">
            <h1 className="lx-h2">check your inbox.</h1>
            <p className="lx-sub">
              we sent a verification link to your email address. click the link to activate your
              account.
            </p>
          </div>

          <form
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <Field
              id="ven-email"
              label="email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              register={register('email')}
            />

            {resendMutation.error ? (
              <p style={{ color: 'var(--lx-error-text)', fontSize: '14px', margin: 0 }}>
                {resendMutation.error.message}
              </p>
            ) : null}
            {successMessage ? (
              <p style={{ color: 'var(--lx-success-text)', fontSize: '14px', margin: 0 }}>
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="lx-btn-primary"
              disabled={isSubmitting || resendMutation.isPending}
            >
              resend verification email
            </button>
          </form>

          <div className="lx-foot-block">
            already verified? <Link to={ROUTES.LOGIN}>sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
