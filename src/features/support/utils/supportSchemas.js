import { z } from 'zod';

/**
 * Every rule here mirrors a jakarta.validation annotation on the matching
 * backend request record. The backend is the source of truth: these schemas
 * must not reject a value the server accepts, nor accept one the server
 * rejects.
 *
 * Sizes come from `CreateSupportTicketRequest`, `PublicSupportTicketRequest`,
 * `SignedAppealRequest` and `CreateVerificationRequest`.
 */

const SUBJECT_MAX = 200;
const BODY_MAX = 5000;
const EMAIL_MAX = 255;
const CLAIMED_NAME_MAX = 100;
const EVIDENCE_MAX = 2000;

/**
 * The number of evidence fields a verification request must carry.
 *
 * The server enforces the same floor independently and answers
 * `VERIFICATION_INSUFFICIENT_EVIDENCE`. It is mirrored here so the requirement
 * is visible while the form is being filled in rather than arriving as a
 * rejection after submission.
 */
export const MIN_EVIDENCE_FIELDS = 3;

/** The seven evidence fields, in the order the form presents them. */
export const EVIDENCE_FIELDS = [
  { name: 'evidenceWebsite', label: 'official website' },
  { name: 'evidenceOtherProfile', label: 'a verified profile elsewhere' },
  { name: 'evidenceEmailDomain', label: 'an organisational email domain' },
  { name: 'evidencePublishedWork', label: 'published work' },
  { name: 'evidencePress', label: 'press coverage' },
  { name: 'evidenceAward', label: 'an award or honour' },
  { name: 'evidenceOther', label: 'anything else that helps' },
];

const subjectField = z
  .string()
  .trim()
  .min(1, 'give your request a short summary.')
  .max(SUBJECT_MAX, `keep the summary to ${SUBJECT_MAX} characters or fewer.`);

const bodyField = z
  .string()
  .trim()
  .min(1, 'tell us what happened.')
  .max(BODY_MAX, `keep the message to ${BODY_MAX} characters or fewer.`);

const evidenceField = z
  .string()
  .trim()
  .max(EVIDENCE_MAX, `keep each piece of evidence to ${EVIDENCE_MAX} characters or fewer.`)
  .optional()
  .or(z.literal(''));

/** The authenticated ticket form, for every category except verification. */
export const ticketSchema = z.object({
  category: z.string().trim().min(1, 'choose what this is about.'),
  subject: subjectField,
  body: bodyField,
});

/**
 * The anonymous public form.
 *
 * Carries the address the confirmation link is sent to. The Turnstile token is
 * validated separately rather than as a schema field, so a failed challenge
 * reads as its own state instead of as a form validation error.
 */
export const publicTicketSchema = z.object({
  contactEmail: z
    .string()
    .trim()
    .min(1, 'we need an address to reply to.')
    .max(EMAIL_MAX, `keep the address to ${EMAIL_MAX} characters or fewer.`)
    .email('that does not look like an email.'),
  category: z.string().trim().min(1, 'choose what this is about.'),
  subject: subjectField,
  body: bodyField,
});

/**
 * The appeal form reached from a signed link.
 *
 * The category is not a field. It is taken from the token server-side, so a
 * submitter cannot appeal something the link did not authorise.
 */
export const appealSchema = z.object({
  subject: subjectField,
  body: bodyField,
});

/**
 * The verification request.
 *
 * The evidence floor is expressed as a whole-object refinement rather than a
 * per-field rule, because no single field is required: what is required is that
 * at least three of the seven carry something.
 */
export const verificationSchema = z
  .object({
    categoryKey: z.string().trim().min(1, 'choose the category you are known in.'),
    claimedName: z
      .string()
      .trim()
      .min(1, 'tell us the name you are known by.')
      .max(CLAIMED_NAME_MAX, `keep the name to ${CLAIMED_NAME_MAX} characters or fewer.`),
    evidenceWebsite: evidenceField,
    evidenceOtherProfile: evidenceField,
    evidenceEmailDomain: evidenceField,
    evidencePublishedWork: evidenceField,
    evidencePress: evidenceField,
    evidenceAward: evidenceField,
    evidenceOther: evidenceField,
  })
  .superRefine((values, ctx) => {
    if (countEvidence(values) < MIN_EVIDENCE_FIELDS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceWebsite'],
        message: `fill at least ${MIN_EVIDENCE_FIELDS} evidence fields.`,
      });
    }
  });

/**
 * How many of the seven evidence fields carry a non-blank value.
 *
 * Exported so the form can show the running count live while it is being filled
 * in, which is what makes the requirement visible before submission.
 *
 * @param {Object} values the verification form's current values
 * @returns {number} the count of filled evidence fields
 */
export const countEvidence = (values = {}) =>
  EVIDENCE_FIELDS.filter((field) => (values[field.name] ?? '').trim().length > 0).length;
