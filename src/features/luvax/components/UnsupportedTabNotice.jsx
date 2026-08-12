import { v } from '@/config/tokens';
import { LxIcon } from './primitives';

const COPY = {
  photos: {
    icon: 'image',
    title: "photo-only posts aren't available yet.",
    detail: 'this view needs a way to ask for a profile\'s posts that carry media, which the server does not offer yet.',
  },
  liked: {
    icon: 'heart',
    title: "liked posts aren't available yet.",
    detail: 'this view needs a way to ask for the posts an account has liked, which the server does not offer yet.',
  },
};

/**
 * The state a profile tab renders when the data it needs cannot be requested.
 *
 * Neither a media-filtered view of a profile's posts nor a list of an account's
 * liked posts exists on the server. Both were verified against the running
 * backend; see docs/search-saved-and-tabs/endpoint-verification.md.
 *
 * Filtering the one page of posts already in hand was rejected. It would
 * produce a grid missing every post beyond the first page and would paginate
 * incorrectly, while looking to the viewer like a working feature.
 *
 * The wording is deliberately "not available yet" rather than an empty result.
 * An empty grid would assert that the account has no such posts, which is a
 * claim about data nobody has. It is also not phrased as a fault, because
 * nothing here is broken.
 *
 * This treatment is derived. The design export does not define it. It reuses
 * the centred-notice spacing and muted foreground the other empty states use.
 */
export function UnsupportedTabNotice({ tab }) {
  const copy = COPY[tab];
  if (!copy) return null;

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
      <LxIcon name={copy.icon} size={36} color={v.ink3} />
      <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, maxWidth: 320, lineHeight: 1.5 }}>
        {copy.title}
      </div>
      <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3, maxWidth: 320, lineHeight: 1.5 }}>
        {copy.detail}
      </div>
    </div>
  );
}
