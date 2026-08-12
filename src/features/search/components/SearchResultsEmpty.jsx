import { v } from '@/config/tokens';
import { LxIcon } from '@/features/luvax/components/primitives';

/**
 * The non-populated states shared by every half of the search screen.
 *
 * The design export defines a search input and an explore grid but no results
 * screen, so the treatment here is derived: it reuses the centred-notice
 * spacing, the muted `ink3` foreground, and the icon sizing the followers and
 * profile screens already use for their own empty states.
 */
function Notice({ icon, title, detail, tone = 'muted' }) {
  return (
    <div
      style={{
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <LxIcon name={icon} size={36} color={tone === 'error' ? v.error : v.ink3} />
      <div
        style={{
          fontFamily: v.fontBody,
          fontSize: 14,
          color: tone === 'error' ? v.error : v.ink2,
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        {title}
      </div>
      {detail && (
        <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, maxWidth: 320, lineHeight: 1.5 }}>
          {detail}
        </div>
      )}
    </div>
  );
}

/** Shown before the viewer has typed anything to search for. */
export function SearchPrompt() {
  return <Notice icon="explore" title="search for posts, people, or tags" />;
}

/** Shown while the first page of a half is in flight. */
export function SearchLoading({ label }) {
  return <Notice icon="explore" title={`searching ${label}...`} />;
}

/**
 * Shown when a half rejected.
 *
 * This is deliberately worded so it cannot be mistaken for an empty result,
 * because the two mean different things and the viewer can act on one of them.
 */
export function SearchFailed({ label }) {
  return (
    <Notice
      icon="alert"
      tone="error"
      title={`we couldn't search ${label}.`}
      detail="check your connection and try again."
    />
  );
}

/**
 * Shown when a half returned zero rows.
 *
 * The post half cannot state this plainly. Post search is backed by
 * Elasticsearch and returns an empty page rather than an error when that
 * backend is unavailable, verified by stopping the container and observing an
 * identical response. "No matches" and "search is down" are indistinguishable
 * on the wire, so the post copy covers both readings rather than asserting a
 * fact the response does not support. The people and tags halves do not
 * degrade this way and state the empty case plainly.
 */
export function SearchEmpty({ label, query, ambiguous = false }) {
  return (
    <Notice
      icon="explore"
      title={`no ${label} match "${query}"`}
      detail={ambiguous ? 'or search is temporarily unavailable.' : undefined}
    />
  );
}
