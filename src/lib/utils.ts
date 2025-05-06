import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Converts a plain text string into an array of paragraphs.
 *
 * This function splits the input text by double newlines ('\n\n'),
 * which is a common way to denote paragraph breaks in plain text.
 * Empty paragraphs are filtered out from the result.
 *
 * @param content - The plain text string to be split into paragraphs
 * @returns An array of non-empty paragraph strings
 *
 * @example
 * ```
 * const text = "First paragraph.\n\nSecond paragraph.\n\n\n\nThird paragraph.";
 * const paragraphs = plainContentToParagraphs(text);
 * // Returns: ["First paragraph.", "Second paragraph.", "Third paragraph."]
 * ```
 */
export function plainContentToParagraphs(content: string): string[] {
  return content.split('\n\n').filter(Boolean);
}

export function scrollPage(pos: 'top' | 'bottom') {
  window.scrollTo({
    top: pos === 'top' ? 0 : document.body.scrollHeight,
    behavior: 'smooth'
  });
}

/**
 * Utility function to conditionally join CSS class names together.
 *
 * This function combines the functionality of `clsx` and `twMerge` to efficiently
 * merge multiple class value inputs. It first processes the inputs with `clsx`
 * to handle conditional classes, then applies `twMerge` to properly handle
 * Tailwind CSS class conflicts.
 *
 * @param inputs - An array of class values which can be strings, objects, arrays, etc.
 * @returns A string of merged class names with conflicts resolved
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn('px-2', 'py-1', 'bg-red-500');  // 'px-2 py-1 bg-red-500'
 *
 * // With conditional classes
 * cn('btn', { 'btn-primary': isPrimary, 'btn-secondary': !isPrimary });
 *
 * // With conflicting Tailwind classes
 * cn('px-2', 'px-4');  // 'px-4' (the later class wins)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
