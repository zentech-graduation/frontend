import { z } from 'zod';

/**
 * Zod schemas mirroring the backend's validation annotations, following
 * authSchemas.js as the canonical example.
 *
 * The limits are the backend's own: subject is @Size(max = 200) and body is
 * @Size(max = 5000). Matching them here means a submission that would be
 * rejected at the wire is caught before it is sent, and a limit changed on the
 * backend shows up as a disagreement here rather than as a surprise 400.
 */
const subject = z
  .string()
  .trim()
  .min(1, 'Add a short subject.')
  .max(200, 'Keep the subject under 200 characters.');

const body = z
  .string()
  .trim()
  .min(1, 'Tell us what happened.')
  .max(5000, 'Keep this under 5000 characters.');

export const ticketSchema = z.object({
  category: z.string().min(1, 'Choose what this is about.'),
  subject,
  body,
});

/** The appeal path carries no category: the token fixes it. */
export const appealSchema = z.object({
  subject,
  body,
});

export const publicTicketSchema = z.object({
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Add an email address.')
    .email('That does not look like an email address.')
    .max(255, 'That address is too long.'),
  category: z.string().min(1, 'Choose what this is about.'),
  subject,
  body,
  // Present only once the widget has produced one. The message is what the user
  // sees when they submit before solving the challenge.
  turnstileToken: z.string().min(1, 'Complete the verification challenge first.'),
});

/** Formats a ZodError into a field-keyed map the forms render inline. */
export const toFieldErrors = (error) => {
  const out = {};
  for (const issue of error.issues ?? []) {
    const key = issue.path?.[0];
    if (key && !out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
};
