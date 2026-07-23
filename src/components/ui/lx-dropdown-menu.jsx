import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { v } from '@/config/tokens';
import { LxIcon } from '@/components/ui/lx-icon';

export function LxDropdownMenu({ anchorRef, open, onClose, items, width = 196, align = 'left', zIndex = 1200 }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom' });

  useLayoutEffect(() => {
    if (!open || typeof window === 'undefined') {
      return undefined;
    }

    const updatePosition = () => {
      const anchor = anchorRef?.current;
      const menu = menuRef.current;
      if (!anchor || !menu) return;

      const rect = anchor.getBoundingClientRect();
      const menuHeight = menu.offsetHeight || 0;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const gap = 10;
      const shouldOpenUp = rect.bottom + menuHeight + gap > viewportHeight && rect.top > menuHeight + gap;
      const top = shouldOpenUp
        ? Math.max(gap, rect.top - menuHeight - 8)
        : Math.min(viewportHeight - menuHeight - gap, rect.bottom + 8);
      const preferredLeft = align === 'right' ? rect.left : rect.right - width;
      const left = Math.min(Math.max(gap, preferredLeft), viewportWidth - width - gap);

      setPosition({
        top,
        left,
        placement: shouldOpenUp ? 'top' : 'bottom',
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, anchorRef, open, width]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const anchor = anchorRef?.current;
      const menu = menuRef.current;
      if (!menu || menu.contains(event.target) || anchor?.contains(event.target)) {
        return;
      }
      onClose?.();
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [anchorRef, onClose, open]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className={`lx-popover-menu ${position.placement === 'top' ? 'is-up' : 'is-down'}`}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width,
        zIndex,
      }}
    >
      {items.filter(Boolean).map((item) => (
        <button
          key={item.id}
          type="button"
          className={`lx-popover-item ${item.tone === 'danger' ? 'is-danger' : ''} ${item.separator ? 'has-separator' : ''}`}
          onClick={() => {
            item.onClick?.();
            onClose?.();
          }}
          disabled={item.disabled}
        >
          {item.icon ? <LxIcon name={item.icon} size={16} color={item.tone === 'danger' ? v.error : v.ink2} /> : null}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
