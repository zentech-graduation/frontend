import { useEffect, useRef, useState } from 'react';
import { v } from '@/config/tokens';
import { getFrameRatio, getMediaList, isVideoMedia } from '@/utils/helpers';
import { LxIcon } from './primitives';

// Derived, not from the design: the design defines no carousel and no control
// that sits on top of a photograph. 26,24,22 is the design's own card shadow
// colour, reused here as a scrim so quiet controls stay legible on any image.
const SCRIM = 'rgba(26,24,22,0.28)';

// Shortest horizontal travel that reads as a deliberate swipe rather than a
// tap that wobbled.
const SWIPE_THRESHOLD = 40;

function MediaFallback({ kind }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: v.surfaceSunken,
      }}
    >
      <LxIcon name={kind === 'video' ? 'video' : 'image'} size={20} color={v.ink3} />
      <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>
        {kind === 'video' ? 'video unavailable' : 'image unavailable'}
      </span>
    </div>
  );
}

function MediaItem({ media, active, registerVideo }) {
  const [failed, setFailed] = useState(false);
  const isVideo = isVideoMedia(media);

  if (failed) {
    return <MediaFallback kind={isVideo ? 'video' : 'image'} />;
  }

  // contain, not cover: the frame is already the media's own ratio, so contain
  // fills it exactly for a single item and letterboxes only the carousel items
  // that differ from the first. cover would crop them, which is the defect this
  // component exists to remove.
  const fit = { width: '100%', height: '100%', objectFit: 'contain', display: 'block' };

  if (isVideo) {
    return (
      <video
        ref={registerVideo}
        src={media.cdnUrl}
        style={fit}
        controls={active}
        muted
        playsInline
        preload="metadata"
        data-lxtap="1"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // The frame around this already reserves the media's aspect ratio, so
    // deferring the fetch cannot reintroduce the layout shift that box removed.
    <img
      src={media.cdnUrl}
      alt={media.altText || ''}
      style={fit}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Post media frame. Renders a single asset, or a carousel when the post carries
 * more than one, with one item filling the frame at a time.
 *
 * The frame takes its aspect ratio from the first item and keeps it for every
 * item, so moving through a carousel of mixed shapes never resizes the card.
 */
export function PostMedia({ post, radius = 0, onOpen = null, minAspect = 0.8 }) {
  const items = getMediaList(post);
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const videoRefs = useRef([]);
  const touchStartX = useRef(null);

  const count = items.length;
  const safeIndex = Math.min(index, Math.max(count - 1, 0));

  // Only the visible item plays. Moving to another item stops the previous one
  // rather than leaving it playing behind the frame.
  useEffect(() => {
    videoRefs.current.forEach((node, i) => {
      if (!node || i === safeIndex) return;
      node.pause();
      node.currentTime = 0;
    });
  }, [safeIndex]);

  // A video scrolled out of view keeps playing, and its audio goes with it, so
  // sound continues from a card the reader can no longer see. Playback is not
  // resumed on the way back: the reader stopped watching, and starting again
  // unasked would be its own surprise.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !entry.target.paused) {
            entry.target.pause();
          }
        });
      },
      { threshold: 0.25 },
    );

    const nodes = videoRefs.current.filter(Boolean);
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [count]);

  if (count === 0) return null;

  // The frame keeps the media's own ratio, but caps how tall it may get. A wide
  // single-column feed turns a 9:16 portrait into nearly a whole viewport, so the
  // box is clamped to a minimum width-to-height ratio. Taller media is not cropped:
  // object-fit contain letterboxes it against the page, which reads as breathing
  // room on the flat feed rather than a boxed frame. minAspect is width/height, so
  // 0.8 means the box never exceeds 5:4 tall.
  const rawRatio = getFrameRatio(items[0]);
  const ratio = Math.max(rawRatio, minAspect);
  const isCarousel = count > 1;

  const go = (next) => {
    if (next < 0 || next > count - 1) return;
    setIndex(next);
  };

  const handleKeyDown = (event) => {
    if (!isCarousel) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(safeIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(safeIndex - 1);
    }
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      go(delta < 0 ? safeIndex + 1 : safeIndex - 1);
    }
    touchStartX.current = null;
  };

  const handleClick = (event) => {
    if (!onOpen) return;
    if (event.target.closest('[data-lxtap]')) return;
    onOpen(event);
  };

  const arrowStyle = (side) => ({
    position: 'absolute',
    top: '50%',
    [side]: 8,
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    borderRadius: 999,
    border: 'none',
    background: SCRIM,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    opacity: 0.85,
  });

  return (
    <div
      role={isCarousel ? 'group' : undefined}
      aria-roledescription={isCarousel ? 'carousel' : undefined}
      aria-label={isCarousel ? `post media, ${count} items` : undefined}
      tabIndex={isCarousel ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: String(ratio),
        overflow: 'hidden',
        background: v.surfaceSunken,
        borderRadius: radius,
        cursor: onOpen ? 'pointer' : 'default',
        // v.ink is the design's own tab underline colour, reused as the focus ring.
        outline: focused && isCarousel ? `2px solid ${v.ink}` : 'none',
        outlineOffset: 2,
      }}
    >
      {items.map((media, i) => (
        <div
          key={media.id || i}
          aria-hidden={i !== safeIndex}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === safeIndex ? 1 : 0,
            // Movement between carousel items crossfades rather than snapping.
            transition: 'opacity var(--duration-normal) var(--ease-out)',
            pointerEvents: i === safeIndex ? 'auto' : 'none',
          }}
        >
          <MediaItem
            media={media}
            active={i === safeIndex}
            registerVideo={(node) => {
              videoRefs.current[i] = node;
            }}
          />
        </div>
      ))}

      {isCarousel ? (
        <>
          {safeIndex > 0 ? (
            <button
              type="button"
              data-lxtap="1"
              aria-label="previous item"
              onClick={(event) => {
                event.stopPropagation();
                go(safeIndex - 1);
              }}
              style={arrowStyle('left')}
            >
              <LxIcon name="chevronLeft" size={16} color={v.base} />
            </button>
          ) : null}

          {safeIndex < count - 1 ? (
            <button
              type="button"
              data-lxtap="1"
              aria-label="next item"
              onClick={(event) => {
                event.stopPropagation();
                go(safeIndex + 1);
              }}
              style={arrowStyle('right')}
            >
              <LxIcon name="chevronRight" size={16} color={v.base} />
            </button>
          ) : null}

          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: SCRIM,
              borderRadius: 999,
              padding: '3px 7px',
              fontFamily: v.fontMono,
              fontSize: 10,
              color: v.base,
            }}
          >
            {safeIndex + 1}/{count}
          </div>

          {/* An indicator, not a control: the dots report position and count and
              do not accept clicks, so the frame keeps one click meaning. */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 5,
              background: SCRIM,
              borderRadius: 999,
              padding: '5px 7px',
            }}
          >
            {items.map((media, i) => (
              <span
                key={media.id || i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: v.base,
                  opacity: i === safeIndex ? 1 : 0.45,
                }}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
