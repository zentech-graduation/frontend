import { describe, expect, it } from 'vitest';

import {
  appealSchema,
  publicTicketSchema,
  ticketSchema,
  toFieldErrors,
} from '@/features/support/utils/supportSchemas';

describe('supportSchemas', () => {
  it('accepts a well formed ticket', () => {
    const result = ticketSchema.safeParse({
      category: 'bug_report',
      subject: 'Uploads fail',
      body: 'The second image never finishes.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty subject', () => {
    const result = ticketSchema.safeParse({ category: 'other', subject: '  ', body: 'x' });
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error).subject).toBeTruthy();
  });

  // The limits mirror the backend annotations, so a submission that would be
  // rejected at the wire is caught before it is sent.
  it('rejects a subject over the backend limit of 200', () => {
    const result = ticketSchema.safeParse({
      category: 'other',
      subject: 'a'.repeat(201),
      body: 'x',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a body over the backend limit of 5000', () => {
    const result = ticketSchema.safeParse({
      category: 'other',
      subject: 'x',
      body: 'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  // The appeal path carries no category: the token fixes it, and accepting one
  // from the client would let a submitter appeal something it never authorised.
  it('appealSchema has no category field', () => {
    const result = appealSchema.safeParse({ subject: 'x', body: 'y' });
    expect(result.success).toBe(true);
    expect(Object.keys(result.data)).toEqual(['subject', 'body']);
  });

  it('rejects a malformed public email address', () => {
    const result = publicTicketSchema.safeParse({
      contactEmail: 'not-an-address',
      category: 'other',
      subject: 'x',
      body: 'y',
      turnstileToken: 't',
    });
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error).contactEmail).toBeTruthy();
  });

  // Submitting before solving the challenge must be a named field error rather
  // than a silent failure at the wire.
  it('rejects a public submission with no verification token', () => {
    const result = publicTicketSchema.safeParse({
      contactEmail: 'a@b.test',
      category: 'other',
      subject: 'x',
      body: 'y',
      turnstileToken: '',
    });
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error).turnstileToken).toBeTruthy();
  });

  it('toFieldErrors keeps the first message per field', () => {
    const result = ticketSchema.safeParse({ category: '', subject: '', body: '' });
    const errors = toFieldErrors(result.error);
    expect(Object.keys(errors).sort()).toEqual(['body', 'category', 'subject']);
  });
});
