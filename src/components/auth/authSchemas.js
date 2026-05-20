import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Display name is required.')
      .max(50, 'Display name must be 50 characters or fewer.'),
    email: z.string().trim().min(1, 'Email is required.').email('Please enter a valid email.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must include at least one number.'),
    confirmPassword: z.string().min(8, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const emailSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Please enter a valid email.'),
});

export const verifySchema = z.object({
  otp: z
    .string()
    .trim()
    .min(6, 'Verification code must be 6 characters.')
    .max(12, 'Verification code is too long.'),
});

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must include at least one number.');

export const forgotPasswordResetSchema = z
  .object({
    email: z.string().trim().min(1, 'Email is required.').email('Please enter a valid email.'),
    otp: z
      .string()
      .trim()
      .min(6, 'Verification code must be at least 6 characters.')
      .max(12, 'Verification code is too long.'),
    password: passwordSchema,
    confirmPassword: z.string().min(8, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(6, 'Reset token is required.')
      .max(512, 'Reset token is too long.'),
    password: passwordSchema,
    confirmPassword: z.string().min(8, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
