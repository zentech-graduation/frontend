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
// shared silhouette is what carries "verified". A bare glyph beside a username reads as decoration,
// which is exactly what a verification mark must not do.
//
// The glyph does NOT carry the category to a sighted reader, and this comment used to claim it did.
// Measured at the size the product actually renders - a 9px glyph inside a 14px container - the
// glyphs were blurred at real size and scored pairwise: five of the 28 pairs sit at or above 0.80
// intersection over union and eleven more between 0.65 and 0.80, with the worst, palette against
// clapperboard, at 0.902. Seven of the eight collapse into the same rounded blob. Only music
// survives, and only because it is the one open rather than closed outline.
//
// The category is therefore carried by the accessible name below, which is correct and distinct for
// every category, and the glyph is treated as decoration that hints at it. That is a deliberate
// choice rather than an oversight: redrawing the set so the outer contour distinguishes it is the
// alternative, and it was considered and declined. Do not reintroduce the claim that the glyph says
// "in what" without re-running the blur test against whatever replaces these shapes.
const ACCENT = '#3B82F6';

// Mirrors verification_categories.display_name, which is authoritative. Held here because the badge
// renders next to a username on every surface that shows one and has only the category key to hand;
// fetching the vocabulary per badge is not workable. A caller that already holds the live vocabulary
// should pass categoryLabel instead of relying on this copy.
//
// The keys alone read badly as English in an accessible name - "Verified in screen", "Verified in
// sport" - because the key is a stable identifier rather than a noun phrase.
const CATEGORY_LABEL = {
  business: 'Business and organisations',
  gaming: 'Gaming and streaming',
  music: 'Music',
  science: 'Science and academia',
  screen: 'Screen and performance',
  sport: 'Sport',
  visual_arts: 'Visual arts',
  writing: 'Writing and journalism',
};

// How much of the badge the glyph occupies. Measured at 14px in a browser against all eight glyphs:
// below about half none of them reads, and above 0.66 the widest two, the gamepad and the
// clapperboard, touch the container edge. 0.66 is the largest value that keeps every glyph clear of
// it, and the extra pixel over a smaller ratio is what stops the flask's neck line and the
// palette's dots closing up at that size.
const GLYPH_RATIO = 0.66;

/**
 * The verified badge: one container, one accent colour, the category glyph inside it.
 *
 * Renders nothing when the account is not verified, so a call site can pass its user object
 * straight through without guarding first. That is what keeps it a one-line addition on each of
 * the surfaces that show a username.
 */
export function LxVerifiedBadge({ verified, category, categoryLabel, iconKey, size = 14, title }) {
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

  // The accessible name is what actually tells a reader the category, so it uses the display name
  // rather than the raw key. The key produced "Verified in screen" and "Verified in sport".
  const named = categoryLabel || (category ? CATEGORY_LABEL[category] : null);
  const label = title || (named ? `Verified in ${named}` : 'Verified');

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
      {/*
        Decorative. The span above carries the whole badge's name, and the glyph does not
        distinguish the category at this size in any case, so it must not be announced separately.
      */}
      <span aria-hidden="true" style={{ display: 'inline-flex', lineHeight: 0 }}>
        <LxIcon name={glyph} size={glyphSize} color="#FFFFFF" stroke={glyphStroke} />
      </span>
    </span>
  );
}
