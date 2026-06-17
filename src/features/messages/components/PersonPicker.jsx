import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { v } from '@/config/tokens';
import { LxAvatar } from '@/components/ui/lx-avatar';
import { searchUsers } from '@/services/search.service';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * Picks a person to start a conversation with.
 *
 * Search is debounced and requires two characters: the endpoint is a trigram search over every
 * user, and firing it on each keystroke from the first letter would ask the database to rank most
 * of the table on every press.
 *
 * `excludeIds` filters people out of the results rather than showing them and rejecting the
 * choice afterwards.
 */
export function PersonPicker({ excludeIds = [], onPick, pending }) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const { data, isFetching } = useQuery({
    queryKey: ['users', 'search', debounced],
    queryFn: ({ signal }) => searchUsers(debounced, null, 8, signal),
    enabled: debounced.length >= MIN_QUERY_LENGTH,
  });

  // Each row is a summary plus the viewer's relationship to it, so the identity is one level down.
  const results = (data?.data?.content || [])
    .map((row) => row.user || row)
    .filter((candidate) => candidate?.id && !excludeIds.includes(candidate.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="search for someone"
        aria-label="search for someone"
        style={{
          height: 32,
          borderRadius: 999,
          border: 'none',
          background: v.surface,
          padding: '0 12px',
          fontFamily: v.fontBody,
          fontSize: 13,
          color: v.ink,
          outline: 'none',
        }}
      />

      {debounced.length >= MIN_QUERY_LENGTH && !isFetching && results.length === 0 ? (
        <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>no one found</div>
      ) : null}

      {results.map((candidate) => (
        <button
          key={candidate.id}
          type="button"
          disabled={pending}
          onClick={() => {
            onPick(candidate.id);
            setTerm('');
            setDebounced('');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 8px',
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            cursor: pending ? 'default' : 'pointer',
            textAlign: 'left',
            opacity: pending ? 0.5 : 1,
          }}
        >
          <LxAvatar size={26} src={candidate.avatarUrl || undefined} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: v.fontBody,
                fontSize: 13,
                color: v.ink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {candidate.displayName || candidate.username}
            </div>
            <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>
              @{candidate.username}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
