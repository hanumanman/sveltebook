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
