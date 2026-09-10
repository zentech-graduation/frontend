import { ROUTES } from '@/config/constants';
import { v } from '@/config/tokens';

/**
 * The shared surface pieces for the help centre.
 *
 * Local to this slice rather than promoted to `src/components/ui`, because
 * nothing outside support renders them yet and a shared primitive with one
 * caller is a guess about the future rather than a shared primitive.
 *
 * Every value comes from the token object. Copy is lowercase throughout, per
 * the design system's voice rule.
 */

/**
 * The frame the three anonymous routes render inside.
 *
 * Standalone rather than inside the application shell: an account following an
 * appeal link is banned and signed out, so the shell's navigation, rail and
 * session-dependent chrome would either fail or offer routes it cannot reach.
 */
export function SupportPage({ title, intro, children, width = 560 }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: v.base,
        display: 'flex',
        justifyContent: 'center',
        padding: '48px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: width }}>
        {/*
          A minimal header, deliberately not the signed-in shell. These three routes are the whole
          of the product to somebody who cannot sign in, and they carried no logo, no product name
          and no link at all: the rendered text began "contact support" and ended "send request".
          One mark, linked to the public entry point, is the smallest thing that is not zero.
        */}
        <header style={{ marginBottom: 28 }}>
          <a
            href={ROUTES.HOME}
            aria-label="luvax home"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              // A 44px-tall hit area at every width, while the mark itself stays small.
              minHeight: 44,
            }}
          >
            <img src="/luvax-mark.png" alt="" width={24} height={24} style={{ display: 'block' }} />
            <span
              style={{
                fontFamily: v.fontDisplay,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: v.ink,
              }}
            >
              luvax
            </span>
          </a>
        </header>
        <h1
          style={{
            fontFamily: v.fontDisplay,
            fontSize: 30,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: v.ink,
            margin: '0 0 8px',
            fontWeight: 700,
          }}
        >
          {title}
        </h1>
        {intro ? (
          <p
            style={{
              fontFamily: v.fontBody,
              fontSize: 15,
              lineHeight: 1.5,
              color: v.ink2,
              margin: '0 0 24px',
            }}
          >
            {intro}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/** A metadata eyebrow. Uppercase here is the one sanctioned exception, for labels. */
export function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontFamily: v.fontMono,
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: v.ink2,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

/** A labelled control. The label is a real `<label>`, so clicking it focuses the field. */
export function Field({ label, hint, error, htmlFor, children }) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontFamily: v.fontBody,
          fontSize: 13,
          fontWeight: 500,
          color: v.ink2,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint ? (
        <div
          id={hintId}
          style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink2, marginTop: 5 }}
        >
          {hint}
        </div>
      ) : null}
      {error ? (
        <div
          id={errorId}
          role="alert"
          style={{ fontFamily: v.fontBody, fontSize: 12, color: v.errorText, marginTop: 5 }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}

/** The primary action. Pill radius, accent fill, lowercase label. */
export function PrimaryButton({ children, disabled, ...rest }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        fontFamily: v.fontBody,
        fontSize: 15,
        fontWeight: 500,
        // The accent fill is the same colour in both themes, so the label cannot use a token that
        // flips with the theme. v.ink did: it is near-black in the light theme, where it measures
        // 7.95:1 on the accent, and near-white in the dark theme, where it measures 1.91:1 - so
        // `send request` and `send appeal` were unreadable in dark on the only screens an
        // anonymous submitter uses. v.black is theme-invariant and clears 9:1 in both, which is
        // what the admin panel and the luvax primitives already do for the same fill.
        color: v.black,
        background: v.accent,
        border: 'none',
        borderRadius: 999,
        padding: '10px 20px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/** A calm, non-alarming notice. Used for the states that are not failures. */
export function Notice({ tone = 'neutral', children, role }) {
  const palette = {
    neutral: { bg: v.surface, border: v.border, text: v.ink2 },
    good: { bg: v.successDim, border: v.success, text: v.successText },
    bad: { bg: v.errorDim, border: v.error, text: v.errorText },
    warn: { bg: v.warningDim, border: v.warning, text: v.warningText },
  }[tone];

  return (
    <div
      role={role}
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        fontFamily: v.fontBody,
        fontSize: 14,
        lineHeight: 1.5,
        color: palette.text,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

/** A ticket's status, rendered as a chip rather than raw enum text. */
export function StatusChip({ label }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: v.fontMono,
        fontSize: 11,
        letterSpacing: '0.04em',
        color: v.ink2,
        background: v.surfaceRaised,
        border: `1px solid ${v.border}`,
        borderRadius: 999,
        padding: '3px 10px',
      }}
    >
      {label}
    </span>
  );
}
