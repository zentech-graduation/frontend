import { v } from '@/config/tokens';

/**
 * Derived pattern: a single status indicator that serves every status
 * enumeration in the panel (report, account, hashtag, post). The design export
 * defines no such component, so this is derived work built from the four
 * semantic colour tokens plus a neutral tone from the surface and ink scale.
 *
 * One visual vocabulary serves all four domains by encoding lifecycle position
 * rather than domain. The mapping and its reasoning are recorded in
 * design-decisions.md. Any status not in the map falls back to the neutral tone
 * rather than throwing, so a value added to a backend enum still renders.
 */
const TONES = {
  positive: { bg: v.successDim, color: v.successText },
  caution: { bg: v.warningDim, color: v.warningText },
  critical: { bg: v.errorDim, color: v.errorText },
  attention: { bg: v.accentDim, color: v.accentText },
  neutral: { bg: v.surface, color: v.ink3, border: v.border },
};

const STATUS_TONE = {
  // Healthy live states.
  active: 'positive',
  published: 'positive',
  resolved: 'positive',
  // In progress or awaiting attention.
  pending: 'caution',
  reviewing: 'caution',
  draft: 'caution',
  archived: 'caution',
  suspended: 'caution',
  // Taken out of service.
  banned: 'critical',
  removed: 'critical',
  deactivated: 'critical',
  // Handed up for a higher decision.
  escalated: 'attention',
  // Closed with no action taken; deliberately understated rather than red.
  dismissed: 'neutral',
};

export function StatusBadge({ status, size = 'md' }) {
  if (!status) {
    return null;
  }
  const tone = TONES[STATUS_TONE[status]] ?? TONES.neutral;
  const sizes = {
    sm: { fontSize: 10, padding: '2px 8px' },
    md: { fontSize: 11, padding: '3px 10px' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: v.fontMono,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
        border: `1px solid ${tone.border ?? 'transparent'}`,
        whiteSpace: 'nowrap',
        ...sizes[size],
      }}
    >
      {status}
    </span>
  );
}
