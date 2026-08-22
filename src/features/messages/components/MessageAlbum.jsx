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
  const caption = items.find((item) => item.text)?.text || '';
  const albumRadius = bubbleCornerRadius({
    isMine,
    isFirstInRun,
    isLastInRun: !caption && isLastInRun,
  });

  return (
    <div
      style={{
        width: ALBUM_WIDTH,
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 2,
          borderRadius: albumRadius,
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
      {caption ? (
        <div
          style={{
            maxWidth: '100%',
            marginTop: 2,
            padding: '8px 11px',
            borderRadius: bubbleCornerRadius({
              isMine,
              isFirstInRun: false,
              isLastInRun,
            }),
            background: isMine ? v.accentDim : v.surface,
            color: v.ink,
            fontFamily: v.fontBody,
            fontSize: 13.5,
            lineHeight: 1.42,
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
}
