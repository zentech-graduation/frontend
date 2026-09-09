import { v } from '@/config/tokens';

/**
 * Shared input styling, so every field on every support screen matches.
 *
 * Kept out of the component module so that file exports only components, which
 * is what lets fast refresh replace them without remounting the tree.
 *
 * @param {boolean} invalid whether the field is currently failing validation
 * @returns {Object} inline style for a text input, select or textarea
 */
export const inputStyle = (invalid = false) => ({
  width: '100%',
  fontFamily: v.fontBody,
  fontSize: 15,
  color: v.ink,
  background: v.surfaceSunken,
  border: `1px solid ${invalid ? v.error : v.border}`,
  borderRadius: 8,
  padding: '10px 14px',
  outline: 'none',
  boxSizing: 'border-box',
});
