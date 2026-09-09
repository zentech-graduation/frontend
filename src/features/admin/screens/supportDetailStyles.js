import { v } from '@/config/tokens';

/**
 * The support detail pane's styling.
 *
 * The panel's stylesheet defines layout classes only (`lx-admin-panel-card`,
 * `lx-admin-split`, `lx-admin-control`); everything inside a detail pane is
 * styled inline from the token object, which is what every other detail screen
 * here does. These are shared between the detail screen and its subsections so
 * a label in one section cannot drift from a label in the next.
 */

/** The small uppercase section label, matching the panel's other detail panes. */
export const sectionLabel = {
  fontFamily: v.fontMono,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: v.ink2,
  margin: '0 0 6px',
  fontWeight: 500,
};

/** Body copy inside a detail section. */
export const bodyText = {
  fontFamily: v.fontBody,
  fontSize: 14,
  lineHeight: 1.6,
  color: v.ink,
  margin: 0,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};

/** Secondary body copy, for the things that describe rather than quote. */
export const mutedText = {
  ...bodyText,
  color: v.ink2,
  whiteSpace: 'normal',
};

/** The metadata row under the title. Gapped, so the chips do not run together. */
export const metaRow = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  fontFamily: v.fontBody,
  fontSize: 12,
  color: v.ink2,
  marginTop: 6,
};

export const textarea = (invalid = false) => ({
  width: '100%',
  resize: 'vertical',
  fontFamily: v.fontBody,
  fontSize: 14,
  color: v.ink,
  background: v.surfaceSunken,
  border: `1px solid ${invalid ? v.error : v.border}`,
  borderRadius: 10,
  padding: '10px 12px',
  outline: 'none',
  lineHeight: 1.5,
  boxSizing: 'border-box',
});

/** A calm inline notice: an explanation, not an alarm. */
export const notice = (tone = 'neutral') => {
  const palette = {
    neutral: { bg: v.surface, border: v.border, color: v.ink2 },
    bad: { bg: v.errorDim, border: v.error, color: v.errorText },
    warn: { bg: v.warningDim, border: v.warning, color: v.warningText },
  }[tone];
  return {
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    padding: '10px 12px',
    fontFamily: v.fontBody,
    fontSize: 13,
    lineHeight: 1.55,
    color: palette.color,
    margin: '0 0 14px',
  };
};

/** A detail section, separated by rhythm rather than by rules. */
export const section = { marginBottom: 20 };

/** The row of actions at the foot of a section. */
export const actionRow = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 };
