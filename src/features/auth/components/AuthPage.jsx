import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import { ROUTES } from '@/config/constants';
import { landingPathForRole } from '@/config/roles';
import { useAuthStore } from '@/store/useAuthStore';
import { authPageRegisterSchema, emailSchema, loginSchema } from '../utils/authSchemas';
import Field from './AuthField';
import './AuthPage.css';

const HERO_IMAGES = ['/1.webp', '/2.webp', '/3.webp'];

const WELCOMES = [
  { main: 'explore the things ', accent: 'you love' },
  { main: 'connect with your kind of ', accent: 'fun' },
  { main: 'dive into ', accent: 'what you enjoy' },
  { main: 'your space for ', accent: 'good energy' },
  { main: 'share what makes ', accent: 'you smile' },
  { main: 'discover your next ', accent: 'obsession' },
  { main: 'bring your passions ', accent: 'here' },
];

// The registration form calls its display-name input `name`; the server calls
// the same field `displayName`. Every other name matches.
const SERVER_FIELD_TO_FORM_FIELD = {
  username: 'username',
  email: 'email',
  password: 'password',
  displayName: 'name',
};

/**
 * Places a rejected field's own message beside the field it belongs to.
 *
 * The backend answers a rejected registration with `errors` keyed by field name,
 * naming the specific rule that failed, while `message` says only that
 * validation failed. Returns whether anything was placed, so the caller can fall
 * back to the banner when the failure was not field-level.
 */
const applyServerFieldErrors = (form, fieldErrors) => {
  if (!fieldErrors || typeof fieldErrors !== 'object' || Array.isArray(fieldErrors)) {
    return false;
  }

  let applied = false;

  Object.entries(fieldErrors).forEach(([serverField, message]) => {
    const formField = SERVER_FIELD_TO_FORM_FIELD[serverField];
    if (!formField || typeof message !== 'string' || !message.trim()) {
      return;
    }

    form.setError(formField, { type: 'server', message: message.trim() });
    applied = true;
  });

  return applied;
};

/**
 * What to say about a refused sign-in, and whether support is the way onward.
 *
 * A refusal caused by the account's own state is the one sign-in failure worth
 * naming: the person cannot fix it by trying again, and nothing else in the
 * product will ever tell them, because a banned or suspended account is refused
 * on every authenticated endpoint and can never load a screen to be told there.
 *
 * It is also the one moment the system knows for certain that the person in
 * front of it needs the appeal path, which is why the link belongs here and not
 * only in the page's footer. Before this, `AUTH_ACCOUNT_LOCKED` - a ban - fell
 * through to the generic message and read "we could not sign you in just now.
 * try again in a moment.", inviting a retry that can never succeed.
 *
 * The copy names the state and gives the route onward, and stops there. It does
 * not restate the moderation reason, name the acting staff member or mention a
 * report, which is the same constraint the moderation email is written under.
 * No end date is claimed for a suspension, because the refusal carries none.
 *
 * `AUTH_ACCOUNT_INACTIVE` also covers DEACTIVATED, which no live flow produces
 * today; `AdminServiceImpl` records that it is reserved for a future
 * self-service deactivation, and if that ships this branch needs its own code
 * rather than borrowing the suspension's words.
 *
 * @param {string|undefined} code the `code` field of the error envelope
 * @returns {{text: string, offerSupport: boolean}} the sentence and whether to
 *   offer the support link beside it
 */
const describeLoginFailure = (code) => {
  if (code === 'AUTH_ACCOUNT_LOCKED') {
    return {
      text: 'this account has been banned, so you cannot sign in to it.',
      offerSupport: true,
    };
  }
  if (code === 'AUTH_ACCOUNT_INACTIVE') {
    return {
      text: 'this account is suspended, so you cannot sign in to it at the moment.',
      offerSupport: true,
    };
  }
  if (code === 'AUTH_INVALID_CREDENTIALS') {
    return {
      text: 'that email or password is not right. check them and try again.',
      offerSupport: false,
    };
  }
  return { text: 'we could not sign you in just now. try again in a moment.', offerSupport: false };
};

const getSuccessMessage = (state) => {
  if (typeof state?.registerSuccess === 'string') return state.registerSuccess;
  if (typeof state?.verificationSuccess === 'string') return state.verificationSuccess;
  if (state?.verificationSuccess) return 'Your email has been verified. You can sign in now.';
  if (typeof state?.resetSuccess === 'string') return state.resetSuccess;
  if (state?.resetSuccess)
    return 'Your password has been reset successfully. Sign in with your new password.';
  return '';
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const BackIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const MailIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--lx-accent-text)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 5h16v14H4z" />
    <path d="m4 6 8 6 8-6" />
  </svg>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isReauthRequest = searchParams.get('reauth') === '1';
  const initialView =
    searchParams.get('view') === 'register'
      ? 'register'
      : searchParams.get('view') === 'forgot'
        ? 'forgot'
        : 'login';

  const [view, setView] = useState(initialView);
  const [heroImg] = useState(() => HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);
  const [welcome] = useState(() => WELCOMES[Math.floor(Math.random() * WELCOMES.length)]);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  // { text, offerSupport } once a sign-in has been refused, null before that.
  const [serverError, setServerError] = useState(null);
  const [regServerError, setRegServerError] = useState('');
  const [fpServerError, setFpServerError] = useState('');
  const [fpSent, setFpSent] = useState(false);

  const successMessage = getSuccessMessage(location.state);

  useEffect(() => {
    if (!isReauthRequest) {
      return;
    }

    const clearExistingSession = async () => {
      try {
        await authApi.logout();
      } catch {
        // If the session is already gone server-side, still proceed with a clean sign-in flow.
      } finally {
        logout();
      }
    };

    clearExistingSession();
  }, [isReauthRequest, logout]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const registerForm = useForm({
    resolver: zodResolver(authPageRegisterSchema),
    defaultValues: { username: '', name: '', email: '', password: '' },
  });

  const forgotForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const fpEmailValue = useWatch({ control: forgotForm.control, name: 'email' });

  const goLogin = () => setView('login');
  const goRegister = () => setView('register');
  const goForgot = () => {
    setFpSent(false);
    setView('forgot');
  };

  const handleGoogle = () => {
    setServerError(null);
    setRegServerError('');
    try {
      window.location.href = authApi.getGoogleLoginUrl();
    } catch (error) {
      const message =
        'we could not open google sign-in just now. try again, or use your email and password.';
      if (view === 'register') {
        setRegServerError(message);
      } else {
        setServerError({ text: message, offerSupport: false });
      }
    }
  };

  const onLoginSubmit = async (values) => {
    setServerError(null);

    try {
      const result = await authApi.login(values);
      const { accessToken, refreshToken } = result;

      if (!accessToken) {
        throw new Error('The login response did not return an access token.');
      }

      const user = result.user || (await authApi.getCurrentUser());

      setAuth({ accessToken, refreshToken, user });

      // Where the user lands is decided by role: a moderator or administrator
      // lands in the panel, an ordinary user in the application. A remembered
      // origin from a redirected navigation still wins over the role default.
      const nextPath = location.state?.from?.pathname || landingPathForRole(user?.role);
      navigate(nextPath, { replace: true });
    } catch (error) {
      // The backend returns 403 with code AUTH_EMAIL_NOT_VERIFIED on the
      // envelope's `code` field.
      const errorCode = error?.response?.data?.code;
      if (errorCode === 'AUTH_EMAIL_NOT_VERIFIED') {
        // The identifier may be a username, in which case there is no address
        // to prefill the resend form with.
        const submittedEmail = values.identifier?.includes('@') ? values.identifier : undefined;
        navigate(ROUTES.VERIFY_EMAIL_NOTICE, {
          replace: true,
          state: { email: submittedEmail },
        });
        return;
      }
      logout();
      setServerError(describeLoginFailure(error?.response?.data?.code));
    }
  };

  const onRegSubmit = async (values) => {
    setRegServerError('');

    try {
      await authApi.register({
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
      });

      navigate(ROUTES.VERIFY_EMAIL_NOTICE, { replace: true, state: { email: values.email } });
    } catch (error) {
      // A rejected field carries the specific rule that failed in `errors`,
      // keyed by field name, while `message` only says validation failed.
      // Showing the rule beside the field it belongs to beats repeating the
      // generic sentence in the banner.
      const fieldErrors = error?.response?.data?.errors;
      const applied = applyServerFieldErrors(registerForm, fieldErrors);

      if (!applied) {
        setRegServerError("we couldn't create your account just now. try again in a moment.");
      }
    }
  };

  const onForgotSubmit = async (values) => {
    setFpServerError('');

    try {
      await authApi.forgotPassword(values);
      setFpSent(true);
    } catch (error) {
      setFpServerError("we couldn't send that email just now. try again in a moment.");
    }
  };

  if (view === 'register') {
    const { errors, isSubmitting } = registerForm.formState;

    return (
      <div className="lx-shell">
        <div className="lx-col lx-enter">
          <button type="button" className="lx-back" onClick={goLogin} aria-label="back to login">
            <BackIcon />
          </button>

          <form className="lx-card" onSubmit={registerForm.handleSubmit(onRegSubmit)} noValidate>
            <div className="lx-head">
              <h1 className="lx-h2">get started on luvax</h1>
              <p className="lx-sub">
                create an account to connect with friends, family, and communities of people who
                share your interests.
              </p>
            </div>

            <div className="lx-row">
              <Field
                id="rg-user"
                label="username"
                type="text"
                autoComplete="username"
                error={errors.username?.message}
                register={registerForm.register('username')}
              />
              <Field
                id="rg-name"
                label="display name"
                type="text"
                autoComplete="name"
                error={errors.name?.message}
                register={registerForm.register('name')}
              />
            </div>

            <Field
              id="rg-email"
              label="email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              register={registerForm.register('email')}
            />

            <Field
              id="rg-pw"
              label="password"
              type={showRegPw ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.password?.message}
              register={registerForm.register('password')}
              className="lx-field--pw"
              rightSlot={
                <button
                  type="button"
                  className="lx-pwtoggle"
                  onClick={() => setShowRegPw((shown) => !shown)}
                >
                  {showRegPw ? 'hide' : 'show'}
                </button>
              }
            />

            {regServerError ? (
              <p style={{ color: 'var(--lx-error-text)', fontSize: '14px', margin: 0 }}>
                {regServerError}
              </p>
            ) : null}

            <button
              type="submit"
              className="lx-btn-primary"
              style={{ marginTop: '4px' }}
              disabled={isSubmitting}
            >
              create account
            </button>

            <div className="lx-divider">
              <span />
              <em>or continue with</em>
              <span />
            </div>

            <button type="button" className="lx-btn-oauth" onClick={handleGoogle}>
              <GoogleIcon />
              <span>continue with google</span>
            </button>

            <button type="button" className="lx-btn-secondary" onClick={goLogin}>
              i already have an account
            </button>
            <p className="lx-legal">
              by creating an account you agree to our <a href="#terms">terms</a> and{' '}
              <a href="#privacy">privacy policy</a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'forgot') {
    const { errors, isSubmitting } = forgotForm.formState;

    if (fpSent) {
      return (
        <div className="lx-shell">
          <div className="lx-col lx-enter">
            <button type="button" className="lx-back" onClick={goLogin} aria-label="back to login">
              <BackIcon />
            </button>
            <div className="lx-card">
              <div className="lx-sent-badge">
                <MailIcon />
              </div>
              <div className="lx-head">
                <h1 className="lx-h2">check your inbox</h1>
                <p className="lx-sub">
                  if an account exists for that address, a reset link is on its way to:
                </p>
              </div>
              <p className="lx-sent-mail">{fpEmailValue}</p>
              <button
                type="button"
                className="lx-btn-primary"
                style={{ marginTop: '4px' }}
                onClick={() => {
                  setFpSent(false);
                  forgotForm.reset({ email: '' });
                }}
              >
                send to a different email
              </button>
              <button type="button" className="lx-linkbtn" onClick={goLogin}>
                back to log in
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="lx-shell">
        <div className="lx-col lx-enter">
          <button type="button" className="lx-back" onClick={goLogin} aria-label="back to login">
            <BackIcon />
          </button>

          <form className="lx-card" onSubmit={forgotForm.handleSubmit(onForgotSubmit)} noValidate>
            <div className="lx-head">
              <h1 className="lx-h2">reset your password</h1>
              <p className="lx-sub">
                enter the email on your account and we&apos;ll send you a link to set a new
                password.
              </p>
            </div>

            <Field
              id="fp-email"
              label="email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              register={forgotForm.register('email')}
            />

            {fpServerError ? (
              <p style={{ color: 'var(--lx-error-text)', fontSize: '14px', margin: 0 }}>
                {fpServerError}
              </p>
            ) : null}

            <button
              type="submit"
              className="lx-btn-primary"
              style={{ marginTop: '4px' }}
              disabled={isSubmitting}
            >
              send reset link
            </button>
            <button type="button" className="lx-linkbtn" onClick={goLogin}>
              back to log in
            </button>
            {/*
              A reset link is no use to somebody who has lost the address it
              would be sent to, and that same loss makes the signed appeal link
              and the public form's email confirmation useless too. This is the
              only place the product can offer them anything.
            */}
            <p className="lx-foot">
              lost access to this email?{' '}
              <a className="lx-support-link" href={ROUTES.SUPPORT_PUBLIC}>
                contact support
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  const { errors: loginErrors, isSubmitting: loginSubmitting } = loginForm.formState;

  return (
    <div className="lx-page">
      <aside className="lx-brand">
        <div className="lx-brand-top">
          <img src="/luvax-mark.png" alt="luvax" className="lx-logo" />
        </div>
        <div className="lx-brand-mid">
          <h1 className="lx-welcome">
            {welcome.main}
            <span style={{ color: 'var(--lx-accent-text)' }}>{welcome.accent}</span>
          </h1>
          <div className="lx-photo">
            <img src={heroImg} alt="" />
          </div>
        </div>
      </aside>

      <main className="lx-formside">
        <form
          className="lx-form lx-enter"
          onSubmit={loginForm.handleSubmit(onLoginSubmit)}
          noValidate
        >
          <h2 className="lx-h2-lg">log in to luvax</h2>

          <Field
            id="lg-user"
            label="username or email"
            type="text"
            autoComplete="username"
            error={loginErrors.identifier?.message}
            register={loginForm.register('identifier')}
          />

          <Field
            id="lg-pw"
            label="password"
            type={showLoginPw ? 'text' : 'password'}
            autoComplete="current-password"
            error={loginErrors.password?.message}
            register={loginForm.register('password')}
            className="lx-field--pw"
            rightSlot={
              <button
                type="button"
                className="lx-pwtoggle"
                onClick={() => setShowLoginPw((shown) => !shown)}
              >
                {showLoginPw ? 'hide' : 'show'}
              </button>
            }
          />

          {successMessage ? (
            <p style={{ color: 'var(--lx-success-text)', fontSize: '14px', margin: 0 }}>
              {successMessage}
            </p>
          ) : null}
          {serverError ? (
            <div role="alert" style={{ fontSize: '14px' }}>
              <p style={{ color: 'var(--lx-error-text)', margin: 0 }}>{serverError.text}</p>
              {serverError.offerSupport ? (
                <p style={{ color: 'var(--lx-ink-2)', margin: '6px 0 0' }}>
                  if you think that is wrong,{' '}
                  <a className="lx-support-link" href={ROUTES.SUPPORT_PUBLIC}>
                    ask us to look at it
                  </a>
                  .
                </p>
              ) : null}
            </div>
          ) : null}

          <button type="submit" className="lx-btn-primary" disabled={loginSubmitting}>
            log in
          </button>
          <button type="button" className="lx-btn-forgot" onClick={goForgot}>
            forgotten password
          </button>

          <div className="lx-divider">
            <span />
            <em>or continue with</em>
            <span />
          </div>

          <button type="button" className="lx-btn-oauth" onClick={handleGoogle}>
            <GoogleIcon />
            <span>continue with google</span>
          </button>

          <p className="lx-foot">
            don&apos;t have an account?{' '}
            <button type="button" onClick={goRegister}>
              sign up
            </button>
          </p>
          {/*
            Present whether or not a sign-in has been attempted. Somebody who
            cannot get in may never reach the refusal above - a forgotten
            username produces no account state to name - and until this line
            existed no signed-out surface in the product linked to support at
            all, so the public form was reachable only from an email nobody
            still has.
          */}
          <p className="lx-foot">
            can&apos;t get into your account?{' '}
            <a className="lx-support-link" href={ROUTES.SUPPORT_PUBLIC}>
              contact support
            </a>
          </p>
        </form>
      </main>
    </div>
  );
}
