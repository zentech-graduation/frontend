import { v } from '@/config/tokens';

/**
 * Renders an ISO-8601 UTC instant in the viewer's local timezone, labelled as
 * local. A reviewer reading a report or an audit trail needs to know whether a
 * time was their morning or someone else's, so the zone is shown rather than
 * assumed. The full instant is available on hover for precision.
 */
const localZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
  } catch {
    return 'local';
  }
};

export function LocalTime({ value, showZone = true }) {
  if (!value) {
    return <span style={{ color: v.ink3 }}>-</span>;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return <span style={{ color: v.ink3 }}>-</span>;
  }
  const label = date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <span title={`${value} (UTC)`} style={{ fontFamily: v.fontBody, color: v.ink2 }}>
      {label}
      {showZone ? (
        <span style={{ color: v.ink3, fontSize: '0.85em', marginLeft: 6 }}>{localZone()}</span>
      ) : null}
    </span>
  );
}
