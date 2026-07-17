import { useEffect, useState } from 'react';
import { v } from '@/features/luvax/constants/tokens';
import { LxIcon } from '@/features/luvax/components/primitives';

export function LxHeaderSearch({ navigate, viewport, screen, params = {} }) {
  const [query, setQuery] = useState(params?.q || '');

  useEffect(() => {
    setQuery(params?.q || '');
  }, [params?.q]);

  const openSearch = (nextQuery = query, focusSearch = true) => {
    navigate('explore', { q: nextQuery, focusSearch });
  };

  const submitSearch = () => {
    const nextQuery = query.trim();
    openSearch(nextQuery, false);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
      className="lx-search-btn"
      style={{
        width: viewport === 'tablet' ? 184 : 206,
        minWidth: 0,
        flexShrink: 0,
        height: viewport === 'tablet' ? 32 : 36,
        padding: '0 14px',
        border: `1px solid ${v.borderSubtle}`,
        borderRadius: 999,
        background: v.surface,
        color: v.ink3,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transform: 'translateY(0px)',
        cursor: 'text',
        fontFamily: v.fontBody,
        fontSize: 13,
        letterSpacing: '-0.01em',
        transition: 'background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out',
      }}
    >
      <LxIcon name="explore" size={15} color={v.ink3} />
      <input
        type="search"
        value={query}
        aria-label="search posts"
        placeholder="search"
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submitSearch();
            event.currentTarget.blur();
          }
        }}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: v.ink2,
          fontFamily: v.fontBody,
          fontSize: 13,
          letterSpacing: '-0.01em',
        }}
      />
    </form>
  );
}

if (typeof window !== 'undefined') {
  window.LxHeaderSearch = LxHeaderSearch;
}
