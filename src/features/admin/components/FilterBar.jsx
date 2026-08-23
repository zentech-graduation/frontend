import { v } from '@/config/tokens';
import { LxTag } from '@/features/luvax/components/primitives';
import { LxIcon } from '@/components/ui/lx-icon';

/**
 * Derived pattern: a filter bar over small, fixed enumerations. Built from
 * `LxTag` in its active state, which is a ready-made filter chip. Each group
 * offers an "all" chip plus one chip per value; selecting a value serialises to
 * only the endpoint's declared parameter keys upstream, and changing any filter
 * resets pagination because the query key includes the filter values.
 *
 * A disabled option renders as unavailable and unselectable rather than hidden,
 * so a value that a historical record still references stays visible.
 *
 * @param {Object[]} groups each `{ key, label, value, options: [{value,label,disabled}] }`
 * @param {(key:string, value:string)=>void} onChange
 * @param {()=>void} onClear
 * @param {boolean} isDirty whether any filter is set away from "all"
 */
export function FilterBar({ groups, onChange, onClear, isDirty }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 18,
        padding: '14px 16px',
        borderBottom: `1px solid ${v.border}`,
      }}
    >
      <LxIcon name="filter" size={14} color={v.ink3} />
      {groups.map((group) => (
        <div
          key={group.key}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
        >
          <span
            style={{
              fontFamily: v.fontMono,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: v.ink3,
            }}
          >
            {group.label}
          </span>
          <LxTag size="sm" active={!group.value} onClick={() => onChange(group.key, '')}>
            all
          </LxTag>
          {group.options.map((option) => (
            <span
              key={option.value}
              style={option.disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
              title={option.disabled ? 'unavailable' : undefined}
            >
              <LxTag
                size="sm"
                active={group.value === option.value}
                onClick={option.disabled ? undefined : () => onChange(group.key, option.value)}
              >
                {option.label}
                {option.disabled ? ' (unavailable)' : ''}
              </LxTag>
            </span>
          ))}
        </div>
      ))}
      {isDirty ? (
        <button
          type="button"
          onClick={onClear}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: v.fontBody,
            fontSize: 12,
            color: v.ink3,
            padding: '2px 4px',
          }}
        >
          <LxIcon name="close" size={12} color={v.ink3} />
          clear
        </button>
      ) : null}
    </div>
  );
}
