import { LxIcon } from '@/components/ui/lx-icon';

/**
 * Category key to glyph key.
 *
 * The server sends an icon key and knows nothing about its shape, so this is the only place that
 * decides what a category looks like. A category with no entry falls back to the check glyph, so a
 * ninth category added by a migration renders a plain verified badge until this map catches up
 * rather than rendering nothing at all.
 */
const GLYPH_BY_CATEGORY = {
  music: 'music-note',
  visual_arts: 'palette',
  writing: 'pen-nib',
  science: 'flask',
  screen: 'clapperboard',
  sport: 'medal',
  business: 'briefcase',
  gaming: 'gamepad',
};

const GLYPH_KEYS = new Set(Object.values(GLYPH_BY_CATEGORY));

// The container is one shape and one colour for every category, and that is the whole design. The
// shared silhouette is what carries "verified"; the glyph only says "in what". A bare glyph beside
// a username reads as decoration, which is exactly what a verification mark must not do.
const ACCENT = '#3B82F6';

// How much of the badge the glyph occupies. Below about half it is unreadable at 14px; above about
// 0.66 the wider shapes collide with the container edge.
const GLYPH_RATIO = 0.62;

/**
 * The verified badge: one container, one accent colour, the category glyph inside it.
 *
 * Renders nothing when the account is not verified, so a call site can pass its user object
 * straight through without guarding first. That is what keeps it a one-line addition on each of
 * the surfaces that show a username.
 */
export function LxVerifiedBadge({ verified, category, iconKey, size = 14, title }) {
  if (!verified) return null;

  const resolved = iconKey && GLYPH_KEYS.has(iconKey) ? iconKey : GLYPH_BY_CATEGORY[category];
  const glyph = resolved || 'check';

  // The glyph is drawn in a 24-unit space and rendered at glyphSize px, so one unit is
  // glyphSize/24 px. Solving for the stroke that lands at the target visual width is what keeps it
  // legible at 14px, where a stroke left at the map's default 1.5 would come out under half a
  // pixel and disappear.
  const glyphSize = Math.round(size * GLYPH_RATIO);
  const targetStrokePx = Math.max(1.05, size * 0.078);
  const glyphStroke = (targetStrokePx * 24) / glyphSize;

  const label = title || (category ? `Verified in ${category.replace(/_/g, ' ')}` : 'Verified');

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: ACCENT,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Sits the badge on the optical centre of the name beside it. Baseline alignment alone
        // drops it too low against cap-height text.
        verticalAlign: '-0.14em',
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <LxIcon name={glyph} size={glyphSize} color="#FFFFFF" stroke={glyphStroke} />
    </span>
  );
}
