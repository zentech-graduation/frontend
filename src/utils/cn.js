nom import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind class names safely.
 * Uses clsx for conditional classes + twMerge to resolve conflicts.
 *
 * @param {...(string | undefined | null | false | Record<string, boolean>)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
