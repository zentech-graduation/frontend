import { v } from '@/config/tokens';
import { LxIcon } from '@/components/ui/lx-icon';

/**
 * Derived pattern: a vocabulary-driven reason selector, built in the shared
 * layer because the warning form needs it now and the account phase needs it
 * too. Nothing a human picks from is hardcoded; the options come from the
 * report-reason vocabulary, already sorted by `sortOrder` upstream.
 *
 * A disabled vocabulary entry is rendered as unavailable and unselectable rather
 * than hidden, so a historical reason that has since been disabled stays visible
 * and legible. A native `<select>` renders a disabled `<option>` greyed and
 * unselectable, which is exactly the required behaviour, and it is keyboard- and
 * screen-reader-native. The chevron is drawn over it because the native arrow is
 * inconsistent across platforms.
 *
 * @param {Object[]} reasons vocabulary entries `{ key, displayName, isEnabled }`, pre-sorted
 * @param {string} value the selected reason key
 * @param {(key:string)=>void} onChange
 * @param {string} [error] a field-level error message to show and colour the border
 * @param {boolean} [disabled] whether the control is inert (e.g. a request in flight)
 * @param {string} [id] the id the label points at
 */
export function ReasonSelect({ reasons = [], value, onChange, error, disabled = false, id = 'reason-select' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: v.fontMono,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: v.ink3,
        }}
      >
        reason
      </label>
      <div style={{ position: 'relative' }}>
        <select
          id={id}
          value={value ?? ''}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            fontFamily: v.fontBody,
            fontSize: 14,
            color: value ? v.ink : v.ink3,
            background: v.surfaceSunken,
            border: `1px solid ${error ? v.error : v.border}`,
            borderRadius: 10,
            padding: '10px 36px 10px 12px',
            outline: 'none',
            cursor: disabled ? 'default' : 'pointer',
          }}
        >
          <option value="" disabled>
            select a reason
          </option>
          {reasons.map((reason) => (
            <option key={reason.key} value={reason.key} disabled={reason.isEnabled === false}>
              {reason.displayName}
              {reason.isEnabled === false ? ' (unavailable)' : ''}
            </option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <LxIcon name="chevronDown" size={16} color={v.ink3} />
        </span>
      </div>
      <span style={{ fontFamily: v.fontBody, fontSize: 12, color: error ? v.errorText : 'transparent', minHeight: 16 }}>
        {error || '.'}
      </span>
    </div>
  );
}
