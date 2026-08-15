import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v } from '@/config/tokens';
import { ROUTES } from '@/config/constants';
import { LxIcon } from '@/components/ui/lx-icon';

export function LxHeaderSearch({ navigate, viewport }) {
  // The field mirrors the query in the address bar, so a shared or reloaded
  // search URL shows the terms it searched for.
  const [searchParams] = useSearchParams();
  const activeQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(activeQuery);

  useEffect(() => {
    setQuery(activeQuery);
  }, [activeQuery]);

  const openSearch = (nextQuery = query, focusSearch = true) => {
    const next = new URLSearchParams();
    if (nextQuery) {
      next.set('q', nextQuery);
    }
    if (focusSearch) {
      next.set('focusSearch', '1');
    }
    const search = next.toString();
    // Submitting goes to the explore search, which keeps the navigation bar, so
    // the header field and the explore field are one search experience rather
    // than two, and the nav never disappears on a results page.
    navigate(search ? `${ROUTES.EXPLORE}?${search}` : ROUTES.EXPLORE);
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
