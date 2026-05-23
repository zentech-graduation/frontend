import { useState } from 'react';
import { v } from '../constants/tokens';
import { TOPICS, TRENDING } from '../constants/data';
import { LxIcon, LxAvatar, LxTag } from './primitives';

function MiniCard({ p, navigate }) {
  return (
    <div onClick={() => navigate('post', { post: p })} style={{
      background: v.surface, borderRadius: 10, overflow: 'hidden',
      cursor: 'pointer', breakInside: 'avoid', marginBottom: 8,
      display: 'inline-block', width: '100%',
    }}>
      {p.img && <div style={{ height: p.h, background: p.color }} />}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <LxAvatar size={18} idx={p.idx} />
          <span style={{ fontFamily: v.fontBody, fontSize: 11, fontWeight: 500, color: v.ink2 }}>{p.author}</span>
        </div>
        <p style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink, lineHeight: 1.5, margin: 0 }}>{p.text}</p>
        {p.tags && p.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {p.tags.map(t => (
              <span key={t} style={{ fontFamily: v.fontMono, fontSize: 9, color: v.accentText, fontWeight: 500 }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ExploreScreen({ navigate, viewport }) {
  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState(null);

  const cols = viewport === 'desktop' ? 3 : 2;

  return (
    <>
      <div style={{
        padding: '12px 16px 14px',
        background: v.base,
        borderBottom: `1px solid ${v.border}`,
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <LxIcon name="explore" size={15} color={v.ink3} />
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="search people, hashtags..."
            style={{
              width: '100%', fontFamily: v.fontBody, fontSize: 15, color: v.ink,
              background: v.surfaceSunken, border: `1px solid ${v.border}`,
              borderRadius: 999, padding: '10px 14px 10px 34px',
              outline: 'none', boxSizing: 'border-box',
            }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Topic chips */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TOPICS.map(t => (
            <LxTag key={t} active={activeTopic === t} onClick={() => setActiveTopic(activeTopic === t ? null : t)}>
              #{t}
            </LxTag>
          ))}
        </div>

        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 16px 12px' }}>
          trending today
        </div>

        {/* Masonry grid */}
        <div style={{ padding: '0 16px 24px', columnCount: cols, columnGap: 8 }}>
          {TRENDING.map((p, i) => <MiniCard key={i} p={p} navigate={navigate} />)}
        </div>
      </div>
    </>
  );
}
