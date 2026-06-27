import { z } from 'zod';

// ─── Shared primitives ────────────────────────────────────────────────────────

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Please enter a valid email.');

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must include at least one number.');

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Login form validation schema.
 * Used with React Hook Form's zodResolver.
 */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Register form validation schema.
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters.')
      .max(30, 'Username must be 30 characters or fewer.')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
    name: z
      .string()
      .trim()
      .max(100, 'Display name must be 100 characters or fewer.')
      .optional()
      .or(z.literal('')),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

// ─── Email-only ───────────────────────────────────────────────────────────────

/** Single-field schema used on the forgot-password and resend-verification forms. */
export const emailSchema = z.object({
  email: emailField,
});

// ─── OTP / verification code ──────────────────────────────────────────────────

/** Used on email-verification pages that accept a short code. */
export const verifySchema = z.object({
  otp: z
    .string()
    .trim()
    .min(6, 'Verification code must be 6 characters.')
    .max(12, 'Verification code is too long.'),
});

// ─── Forgot-password inline reset (email + OTP + new password) ───────────────

export const forgotPasswordResetSchema = z
  .object({
    email: emailField,
    otp: z
      .string()
      .trim()
      .min(6, 'Verification code must be at least 6 characters.')
      .max(12, 'Verification code is too long.'),
    password: passwordField,
    confirmPassword: z.string().min(8, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

// ─── Token-based password reset ───────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
