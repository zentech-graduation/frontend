import { z } from 'zod';
import { usernameField, displayNameField } from '@/utils/validationFields';

// ─── Shared primitives ────────────────────────────────────────────────────────

// Every rule below mirrors a jakarta.validation annotation on the matching
// backend request record. The backend is the source of truth: this schema must
// not reject a value the server accepts, nor accept one the server rejects.
// `usernameField` and `displayNameField` are shared with profile editing (same
// backend constraints on both RegisterRequest and UpdateProfileRequest), so
// they live in the cross-feature utils module instead of being defined here.

const emailField = z
  .string()
  .trim()
  .min(1, 'email is required.')
  .email('please enter a valid email.');

// Backend RegisterRequest.password / ResetPasswordRequest.newPassword, both
// annotated @ValidPassword and enforced by PasswordPolicyValidator.
//
// The server reports at most one violation per value and returns the first rule
// that failed, in the order below. This mirrors that order so the client names
// the same rule the server would have named.
//
// Lengths are counted in code points rather than UTF-16 units, matching
// String.codePointCount, so an astral character counts once here as it does
// there. The byte ceiling is separate and lower than the character ceiling
// because BCrypt truncates above 72 bytes.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const PASSWORD_MAX_UTF8_BYTES = 72;

// Character.isWhitespace, isSpaceChar, isISOControl and the FORMAT category,
// which together already cover the zero-width and joining characters the
// validator lists explicitly.
const BLANK_OR_INVISIBLE = /[\s\p{Zs}\p{Zl}\p{Zp}\p{Cc}\p{Cf}]/u;
// \p{Uppercase} rather than \p{Lu}, to match Character.isUpperCase: it is also
// true for characters carrying Other_Uppercase, such as U+2160 ROMAN NUMERAL
// ONE, which the server accepts as the uppercase character.
const HAS_UPPERCASE = /\p{Uppercase}/u;
// Whitespace and invisible characters are rejected before this runs, so
// anything that is not a letter is a digit or a special character.
const HAS_DIGIT_OR_SPECIAL = /\P{L}/u;

const passwordField = z.string().superRefine((value, ctx) => {
  const addIssue = (message) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  const length = [...value].length;

  if (length < PASSWORD_MIN_LENGTH) {
    addIssue(`password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    return;
  }
  if (length > PASSWORD_MAX_LENGTH) {
    addIssue(`password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`);
    return;
  }
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_UTF8_BYTES) {
    addIssue(`password must be ${PASSWORD_MAX_UTF8_BYTES} bytes or fewer once encoded.`);
    return;
  }
  if (BLANK_OR_INVISIBLE.test(value)) {
    addIssue('password must not contain spaces or invisible characters.');
    return;
  }
  if (!HAS_UPPERCASE.test(value)) {
    addIssue('password must contain at least one uppercase letter.');
    return;
  }
  if (!HAS_DIGIT_OR_SPECIAL.test(value)) {
    addIssue('password must contain at least one digit or special character.');
  }
});

// One-time tokens arrive from an emailed link and are opaque to the client, so
// the only client-side rule is that one is present.
const tokenField = z.string().trim().min(1, 'verification token is required.');

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Login form validation schema.
 * Used with React Hook Form's zodResolver.
 */
// Backend LoginRequest: { identifier, password }, both @NotBlank only. The
// server accepts either an email address or a username in identifier and
// resolves the account type by '@' presence, so no format rule applies here.
// No length rule either: an existing account may predate the current password
// policy, and blocking it client-side would lock that user out.
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'username or email is required.'),
  password: z.string().min(1, 'password is required.'),
});

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Register form validation schema.
 */
export const registerSchema = z
  .object({
    username: usernameField,
    name: displayNameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwords do not match.',
    path: ['confirmPassword'],
  });

/** Register form schema for the unified AuthPage — single password field, no confirmation. */
export const authPageRegisterSchema = z.object({
  username: usernameField,
  name: displayNameField,
  email: emailField,
  password: passwordField,
});

// ─── Email-only ───────────────────────────────────────────────────────────────

/** Single-field schema used on the forgot-password and resend-verification forms. */
export const emailSchema = z.object({
  email: emailField,
});

// ─── OTP / verification code ──────────────────────────────────────────────────

/**
 * Used on email-verification pages.
 *
 * The backend issues an opaque one-time token delivered as a link, not a short
 * numeric code, so no length rule is imposed on the value.
 */
export const verifySchema = z.object({
  token: tokenField,
});

// ─── Forgot-password inline reset (email + OTP + new password) ───────────────

// The reset token comes from the emailed link, not from a code the user reads
// out, so it is validated only for presence. The email address is collected for
// the preceding forgot-password call and is never sent to /auth/reset-password,
// which rejects unrecognised fields.
export const forgotPasswordResetSchema = z
  .object({
    email: emailField,
    token: tokenField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwords do not match.',
    path: ['confirmPassword'],
  });

// ─── Token-based password reset ───────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwords do not match.',
    path: ['confirmPassword'],
  });
