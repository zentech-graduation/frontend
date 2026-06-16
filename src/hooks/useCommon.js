import { useState, useEffect } from 'react';

/**
 * useDebounce — Returns a debounced version of the provided value.
 *
 * @template T
 * @param {T} value
 * @param {number} delay - debounce delay in ms
 * @returns {T}
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
