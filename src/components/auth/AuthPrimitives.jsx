import { forwardRef, useMemo, useState } from 'react';

const strengthMap = [
  { label: '', score: 0, color: 'var(--lx-border)' },
  { label: 'Weak', score: 1, color: 'var(--lx-error)' },
  { label: 'Okay', score: 2, color: 'var(--lx-warning)' },
  { label: 'Strong', score: 3, color: 'var(--lx-success)' },
];

const getPasswordStrength = (password = '') => {
  if (!password) {
    return strengthMap[0];
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) score += 1;

  return strengthMap[Math.min(score, 3)];
};

export function AuthShell({ children, eyebrow, title, subtitle, footer }) {
  return (
    <div className="auth-card">
      {eyebrow ? <span className="auth-card__eyebrow">{eyebrow}</span> : null}
      <div className="auth-card__header">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
      {footer ? <div className="auth-card__footer">{footer}</div> : null}
    </div>
  );
}

export const AuthInput = forwardRef(function AuthInput(
  { label, error, helper, icon, rightSlot, className = '', ...props },
  ref
) {
  return (
    <label className={`auth-field ${className}`.trim()}>
      <span className="auth-field__label">{label}</span>
      <span className={`auth-field__control ${error ? 'is-error' : ''}`}>
        {icon ? <span className="auth-field__icon">{icon}</span> : null}
        <input ref={ref} {...props} />
        {rightSlot ? <span className="auth-field__right">{rightSlot}</span> : null}
      </span>
      {error ? <span className="auth-field__message is-error">{error}</span> : null}
      {!error && helper ? <span className="auth-field__message">{helper}</span> : null}
    </label>
  );
});

export function AuthButton({ children, variant = 'primary', loading, ...props }) {
  return (
    <button className={`auth-button auth-button--${variant}`} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="auth-button__spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function AuthAlert({ tone = 'error', children }) {
  return <div className={`auth-alert auth-alert--${tone}`}>{children}</div>;
}

export function PasswordStrength({ password }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength__bars">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            style={{
              backgroundColor: bar <= strength.score ? strength.color : 'var(--lx-border)',
            }}
          />
        ))}
      </div>
      <span style={{ color: strength.color }}>{strength.label}</span>
    </div>
  );
}

export function OtpInput({ value, onChange, disabled }) {
  return (
    <input
      className="auth-otp"
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="Enter your verification code"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value.replace(/\s+/g, '').slice(0, 12))}
    />
  );
}

export function PasswordToggle({ shown, onToggle }) {
  return (
    <button className="auth-icon-button" type="button" onClick={onToggle} aria-label={shown ? 'Hide password' : 'Show password'}>
      {shown ? 'Hide' : 'Show'}
    </button>
  );
}

export function InlineAction({ children, ...props }) {
  return (
    <button className="auth-inline-action" type="button" {...props}>
      {children}
    </button>
  );
}

export function GoogleButton({ onClick, disabled, label = 'Login with Google' }) {
  return (
    <button className="google-button" type="button" onClick={onClick} disabled={disabled}>
      <span className="google-button__badge" aria-hidden="true">
        G
      </span>
      <span>{label}</span>
    </button>
  );
}

export function AuthDivider({ label = 'or' }) {
  return (
    <div className="auth-divider" aria-hidden="true">
      <span />
      <small>{label}</small>
      <span />
    </div>
  );
}

export function usePasswordToggle() {
  const [shown, setShown] = useState(false);

  return {
    shown,
    toggle: () => setShown((current) => !current),
    type: shown ? 'text' : 'password',
  };
}
