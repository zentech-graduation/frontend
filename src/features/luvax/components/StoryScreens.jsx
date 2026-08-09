import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v } from '@/config/tokens';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar } from './primitives';
import { STORIES } from '../constants/data';
import { ROUTES } from '@/config/constants';

const STORY_CARD_RADIUS = 18;
const STORY_RATIO = 9 / 16;
const STORY_TEXT_BACKGROUNDS = [v.avatar0, v.avatar1, v.base, v.surface, 'var(--lx-accent-dark)', 'var(--lx-ink-2)'];

// ─── Story Stage (shared chrome) ───────────────────────────────────────────
function StoryStage({ children, onClose, footer, viewport }) {
  const isMobile = viewport === 'mobile';

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: v.black, zIndex: 1000,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {children}
          <button onClick={onClose} aria-label="close" style={{
            position: 'absolute', top: 14, right: 12, zIndex: 5,
            background: v.black35, border: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LxIcon name="close" size={20} color={v.white} />
          </button>
        </div>
        {footer}
      </div>
    );
  }

  const cardHeight = `min(82vh, 720px)`;
  const cardWidth  = `calc(${cardHeight} * ${STORY_RATIO})`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: v.black78,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <button onClick={onClose} aria-label="close" style={{
        position: 'absolute', top: 20, right: 20,
        background: v.white12, border: 'none', cursor: 'pointer',
        width: 38, height: 38, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <LxIcon name="close" size={20} color={v.white} />
      </button>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        height: cardHeight,
      }}>
        <div style={{
          width: cardWidth, height: '100%',
          borderRadius: STORY_CARD_RADIUS, overflow: 'hidden', position: 'relative',
          boxShadow: `0 32px 80px ${v.black55}, 0 0 0 1px ${v.white04}`,
        }}>
          {children}
        </div>
        {footer && (
          <div style={{ width: cardWidth }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Story View Screen ──────────────────────────────────────────────────────
export function StoryViewScreen({ viewport: vpProp }) {
  const navigate = useNavigate();
  const { storyId } = useParams();
  const vp = vpProp || useViewport();
  // Stories are still the static reel from the design export; there is no story
  // endpoint behind them yet, so the address resolves against that list. An
  // unknown id falls back to the same placeholder the screen always used.
  const story = STORIES.find((entry) => entry.id === storyId)
    || { author: 'sol.r', idx: 1, type: 'photo', bg: v.surfaceRaised, caption: 'morning' };
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(t); navigate(ROUTES.FEED); return 100; }
        return p + 1.5;
      });
    }, 80);
    return () => clearInterval(t);
  }, []);

  const isDark = story.bg === v.ink || story.bg === v.ink2 || story.bg === 'var(--lx-ink)' || story.bg === 'var(--lx-ink-2)';
  const textInk = isDark ? v.inkInverse : v.ink;

  const card = (
    <div style={{
      position: 'absolute', inset: 0,
      background: story.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {story.type === 'text' && story.text && (
        <div style={{
          fontFamily: v.fontDisplay, fontSize: 38, fontWeight: 600,
          color: textInk,
          textAlign: 'center', lineHeight: 1.2, letterSpacing: '-0.02em',
          padding: '0 32px', whiteSpace: 'pre-line',
        }}>{story.text}</div>
      )}
      {story.type === 'video' && (
        <div style={{
          color: v.white75, fontFamily: v.fontMono, fontSize: 12,
          position: 'absolute', bottom: 24, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <LxIcon name="video" size={14} color={v.white75} />
          <span>0:24</span>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4 }}>
        <div style={{ flex: 1, height: 2, background: v.white30, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: v.white, transition: 'width 80ms linear' }} />
        </div>
      </div>

      {/* Author header */}
      <div style={{
        position: 'absolute', top: 24, left: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <LxAvatar size={30} idx={story.idx} />
        <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.white, textShadow: `0 1px 6px ${v.black40}` }}>{story.author}</span>
        <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.white70 }}>2h</span>
      </div>

      {/* Caption */}
      {story.caption && (
        <div style={{
          position: 'absolute', bottom: 24, left: 16, right: 16,
          fontFamily: v.fontBody, fontSize: 15, fontWeight: 500,
          color: v.white, textShadow: `0 1px 8px ${v.black55}`,
        }}>{story.caption}</div>
      )}

      {/* Tap zones */}
      <button onClick={() => navigate(ROUTES.FEED)} style={{
        position: 'absolute', left: 0, top: 60, bottom: 80, width: '30%',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }} aria-label="previous" />
      <button onClick={() => navigate(ROUTES.FEED)} style={{
        position: 'absolute', right: 0, top: 60, bottom: 80, width: '30%',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }} aria-label="next" />
    </div>
  );

  const replyBar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: vp === 'mobile' ? '12px 16px 20px' : '4px 0',
      background: vp === 'mobile' ? v.black : 'transparent',
    }}>
      <input
        placeholder={`reply to ${story.author}…`}
        style={{
          flex: 1, fontFamily: v.fontBody, fontSize: 14,
          background: v.white08, color: v.white,
          border: `1px solid ${v.white18}`,
          borderRadius: 999, padding: '11px 16px', outline: 'none',
        }} />
      <button aria-label="like" style={{ background: v.white08, border: `1px solid ${v.white18}`, cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LxIcon name="heart" size={18} color={v.white} />
      </button>
      <button aria-label="send" style={{ background: v.white08, border: `1px solid ${v.white18}`, cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LxIcon name="send" size={18} color={v.white} />
      </button>
    </div>
  );

  return (
    <StoryStage viewport={vp} onClose={() => navigate(ROUTES.FEED)} footer={replyBar}>
      {card}
    </StoryStage>
  );
}

// ─── Story Composer Screen ──────────────────────────────────────────────────
export function StoryComposerScreen({ viewport: vpProp }) {
  const navigate = useNavigate();
  const vp = vpProp || useViewport();
  const [mode, setMode] = useState('photo');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(v.avatar0);

  const textBgs = STORY_TEXT_BACKGROUNDS;
  const isDark = bgColor === v.base || bgColor === 'var(--lx-ink-2)';

  const card = (
    <div style={{
      position: 'absolute', inset: 0,
      background: mode === 'text' ? bgColor : v.storySurface,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {mode === 'text' && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="type something…"
          style={{
            fontFamily: v.fontDisplay, fontSize: 30, fontWeight: 600,
            color: isDark ? v.inkInverse : v.ink,
            background: 'transparent', border: 'none', outline: 'none',
            textAlign: 'center', letterSpacing: '-0.02em', lineHeight: 1.2,
            resize: 'none', width: '82%', height: 180, padding: 0,
          }}
        />
      )}
      {mode === 'photo' && (
        <div style={{ color: v.white65, fontFamily: v.fontBody, fontSize: 14, textAlign: 'center' }}>
          <LxIcon name="image" size={48} color={v.white45} />
          <div style={{ marginTop: 12 }}>tap to pick a photo</div>
        </div>
      )}
      {mode === 'video' && (
        <div style={{ color: v.white65, fontFamily: v.fontBody, fontSize: 14, textAlign: 'center' }}>
          <LxIcon name="video" size={48} color={v.white45} />
          <div style={{ marginTop: 12 }}>tap to record · max 60s</div>
        </div>
      )}

      {mode === 'text' && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {textBgs.map(c => (
            <button key={c} onClick={() => setBgColor(c)} aria-label={`background ${c}`} style={{
              width: 26, height: 26, borderRadius: '50%', background: c,
              border: bgColor === c ? `2px solid ${v.white}` : `2px solid ${v.white35}`,
              cursor: 'pointer',
            }} />
          ))}
        </div>
      )}
    </div>
  );

  const canShare = !(mode === 'text' && !text.trim());

  const controls = (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      padding: vp === 'mobile' ? '14px 16px 20px' : '4px 0',
      background: vp === 'mobile' ? v.black : 'transparent',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
        {[['photo', 'image'], ['video', 'video'], ['text', 'type']].map(([m, ic]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: mode === m ? v.white12 : 'transparent',
            border: `1px solid ${mode === m ? v.white25 : v.white12}`,
            cursor: 'pointer', padding: '6px 12px', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 6,
            color: mode === m ? v.white : v.white65,
            fontFamily: v.fontBody, fontSize: 12, fontWeight: 500,
          }}>
            <LxIcon name={ic} size={15} color={mode === m ? v.white : v.white65} />
            {m}
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate(ROUTES.FEED)}
        disabled={!canShare}
        style={{
          width: '100%', fontFamily: v.fontBody, fontSize: 14, fontWeight: 600,
          background: canShare ? v.accent : v.white12,
          color: canShare ? v.ink : v.white40,
          border: 'none', borderRadius: 999, padding: '12px 20px',
          cursor: canShare ? 'pointer' : 'default',
        }}>
        share to story
      </button>
    </div>
  );

  return (
    <StoryStage viewport={vp} onClose={() => navigate(ROUTES.FEED)} footer={controls}>
      {card}
    </StoryStage>
  );
}
