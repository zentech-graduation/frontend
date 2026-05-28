import { useState, useEffect } from 'react';
import { v } from '../constants/tokens';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar } from './primitives';

const STORY_CARD_RADIUS = 18;
const STORY_RATIO = 9 / 16;

// ─── Story Stage (shared chrome) ───────────────────────────────────────────
function StoryStage({ children, onClose, footer, viewport }) {
  const isMobile = viewport === 'mobile';

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {children}
          <button onClick={onClose} aria-label="close" style={{
            position: 'absolute', top: 14, right: 12, zIndex: 5,
            background: 'rgba(0,0,0,0.35)', border: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LxIcon name="close" size={20} color="#fff" />
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
      background: 'rgba(15,13,11,0.78)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <button onClick={onClose} aria-label="close" style={{
        position: 'absolute', top: 20, right: 20,
        background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
        width: 38, height: 38, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <LxIcon name="close" size={20} color="#fff" />
      </button>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        height: cardHeight,
      }}>
        <div style={{
          width: cardWidth, height: '100%',
          borderRadius: STORY_CARD_RADIUS, overflow: 'hidden', position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
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
export function StoryViewScreen({ navigate, params, viewport: vpProp }) {
  const vp = vpProp || useViewport();
  const story = params?.story || { author: 'sol.r', idx: 1, type: 'photo', bg: '#C4BCB2', caption: 'morning' };
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(t); navigate('feed'); return 100; }
        return p + 1.5;
      });
    }, 80);
    return () => clearInterval(t);
  }, []);

  const isDark = story.bg === '#1A1816' || story.bg === '#5C574F';
  const textInk = isDark ? '#F9F7F4' : '#1A1816';

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
          color: 'rgba(255,255,255,0.75)', fontFamily: v.fontMono, fontSize: 12,
          position: 'absolute', bottom: 24, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <LxIcon name="video" size={14} color="rgba(255,255,255,0.75)" />
          <span>0:24</span>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4 }}>
        <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#fff', transition: 'width 80ms linear' }} />
        </div>
      </div>

      {/* Author header */}
      <div style={{
        position: 'absolute', top: 24, left: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <LxAvatar size={30} idx={story.idx} />
        <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>{story.author}</span>
        <span style={{ fontFamily: v.fontMono, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>2h</span>
      </div>

      {/* Caption */}
      {story.caption && (
        <div style={{
          position: 'absolute', bottom: 24, left: 16, right: 16,
          fontFamily: v.fontBody, fontSize: 15, fontWeight: 500,
          color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.55)',
        }}>{story.caption}</div>
      )}

      {/* Tap zones */}
      <button onClick={() => navigate('feed')} style={{
        position: 'absolute', left: 0, top: 60, bottom: 80, width: '30%',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }} aria-label="previous" />
      <button onClick={() => navigate('feed')} style={{
        position: 'absolute', right: 0, top: 60, bottom: 80, width: '30%',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }} aria-label="next" />
    </div>
  );

  const replyBar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: vp === 'mobile' ? '12px 16px 20px' : '4px 0',
      background: vp === 'mobile' ? '#000' : 'transparent',
    }}>
      <input
        placeholder={`reply to ${story.author}…`}
        style={{
          flex: 1, fontFamily: v.fontBody, fontSize: 14,
          background: 'rgba(255,255,255,0.08)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 999, padding: '11px 16px', outline: 'none',
        }} />
      <button aria-label="like" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LxIcon name="heart" size={18} color="#fff" />
      </button>
      <button aria-label="send" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LxIcon name="send" size={18} color="#fff" />
      </button>
    </div>
  );

  return (
    <StoryStage viewport={vp} onClose={() => navigate('feed')} footer={replyBar}>
      {card}
    </StoryStage>
  );
}

// ─── Story Composer Screen ──────────────────────────────────────────────────
export function StoryComposerScreen({ navigate, viewport: vpProp }) {
  const vp = vpProp || useViewport();
  const [mode, setMode] = useState('photo');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState('#C8A97E');

  const textBgs = ['#C8A97E', '#7A9E7A', '#1A1816', '#F0EDE8', '#C4847A', '#5C574F'];
  const isDark = bgColor === '#1A1816' || bgColor === '#5C574F';

  const card = (
    <div style={{
      position: 'absolute', inset: 0,
      background: mode === 'text' ? bgColor : '#2a2622',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {mode === 'text' && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="type something…"
          style={{
            fontFamily: v.fontDisplay, fontSize: 30, fontWeight: 600,
            color: isDark ? '#F9F7F4' : '#1A1816',
            background: 'transparent', border: 'none', outline: 'none',
            textAlign: 'center', letterSpacing: '-0.02em', lineHeight: 1.2,
            resize: 'none', width: '82%', height: 180, padding: 0,
          }}
        />
      )}
      {mode === 'photo' && (
        <div style={{ color: 'rgba(255,255,255,0.65)', fontFamily: v.fontBody, fontSize: 14, textAlign: 'center' }}>
          <LxIcon name="image" size={48} color="rgba(255,255,255,0.45)" />
          <div style={{ marginTop: 12 }}>tap to pick a photo</div>
        </div>
      )}
      {mode === 'video' && (
        <div style={{ color: 'rgba(255,255,255,0.65)', fontFamily: v.fontBody, fontSize: 14, textAlign: 'center' }}>
          <LxIcon name="video" size={48} color="rgba(255,255,255,0.45)" />
          <div style={{ marginTop: 12 }}>tap to record · max 60s</div>
        </div>
      )}

      {mode === 'text' && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {textBgs.map(c => (
            <button key={c} onClick={() => setBgColor(c)} aria-label={`background ${c}`} style={{
              width: 26, height: 26, borderRadius: '50%', background: c,
              border: bgColor === c ? '2px solid #fff' : '2px solid rgba(255,255,255,0.35)',
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
      background: vp === 'mobile' ? '#000' : 'transparent',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
        {[['photo', 'image'], ['video', 'video'], ['text', 'type']].map(([m, ic]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: '1px solid ' + (mode === m ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'),
            cursor: 'pointer', padding: '6px 12px', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 6,
            color: mode === m ? '#fff' : 'rgba(255,255,255,0.65)',
            fontFamily: v.fontBody, fontSize: 12, fontWeight: 500,
          }}>
            <LxIcon name={ic} size={15} color={mode === m ? '#fff' : 'rgba(255,255,255,0.65)'} />
            {m}
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate('feed')}
        disabled={!canShare}
        style={{
          width: '100%', fontFamily: v.fontBody, fontSize: 14, fontWeight: 600,
          background: canShare ? v.accent : 'rgba(255,255,255,0.12)',
          color: canShare ? '#1A1816' : 'rgba(255,255,255,0.4)',
          border: 'none', borderRadius: 999, padding: '12px 20px',
          cursor: canShare ? 'pointer' : 'default',
        }}>
        share to story
      </button>
    </div>
  );

  return (
    <StoryStage viewport={vp} onClose={() => navigate('feed')} footer={controls}>
      {card}
    </StoryStage>
  );
}
