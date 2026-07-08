import { v } from '@/config/tokens';
import { bubbleCornerRadius } from '../utils/bubbleShape';
import { MediaPlaceholder } from './MediaPlaceholder';

// Four tiles read as a grid at a glance; a fifth would either shrink every tile to fit or force
// the album taller than a normal bubble, so it stays hidden behind the "+N" on the fourth instead.
const MAX_VISIBLE_TILES = 4;
const ALBUM_WIDTH = 210;

/**
 * A run of consecutive photo/video messages from one sender, collapsed into one grid tile instead
 * of a stack of separate bubbles. Each tile is still its own message underneath - the grouping
 * happens only here, at render time - so nothing about sending, deleting, or reading the messages
 * individually has to change for it to work.
 *
 * Takes the same run-position props as a text bubble and shapes its own corners the same way, so
 * an album sitting between two bubbles from the same run reads as part of one continuous shape.
 */
export function MessageAlbum({ items, onOpenViewer, isMine, isFirstInRun, isLastInRun }) {
  const visible = items.slice(0, MAX_VISIBLE_TILES);
  const overflow = items.length - MAX_VISIBLE_TILES;

  return (
    <div
      style={{
        width: ALBUM_WIDTH,
        maxWidth: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 2,
        borderRadius: bubbleCornerRadius({ isMine, isFirstInRun, isLastInRun }),
        overflow: 'hidden',
      }}
    >
      {visible.map((item, index) => {
        const isLastTile = index === MAX_VISIBLE_TILES - 1;
        return (
          <div key={item.id} style={{ position: 'relative' }}>
            <MediaPlaceholder
              item={item.media || { label: item.text }}
              onClick={() => onOpenViewer(items, index)}
            />
            {isLastTile && overflow > 0 ? (
              <div
                onClick={() => onOpenViewer(items, index)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: v.fontBody,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +{overflow}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
