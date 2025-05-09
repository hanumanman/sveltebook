import type { INovel } from '$lib/server/db/queries/select';
import fuzzy from 'fuzzy';

/**
 * Normalizes a string by:
 * 1. Decoding URI encoded characters
 * 2. Applying Unicode normalization (NFD)
 * 3. Removing all diacritical marks (accents)
 * 4. Replacing special characters Đ/đ with D/d
 *
 * This is useful for string comparisons where accented characters
 * should match their non-accented counterparts.
 *
 * @param str - The string to normalize
 * @returns The normalized string without diacritical marks
 */
export function getNormalizedString(str: string): string {
  return decodeURI(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd');
}

// Compare a string with its bracketed + normalized version, then combine them
// Example: Compare 'Café' with '[C]a[f][e]' , then return '[C]a[f][é]'
export function processString(original: string, bracketedString: string): string {
  let result = '';
  let bracketCount = 0;

  // Loop through the bracketed string
  for (let i = 0; i < bracketedString.length; i++) {
    const char = bracketedString[i];

    // If the character is a bracket, add a bracket to the result
    if (char === '[') {
      result += '[';
      result += original[i - bracketCount];
      result += ']';
      bracketCount += 2;
      i += 2;
    } else {
      // If the character is not a bracket, add the original character to the result
      result += original[i - bracketCount];
    }
  }
  // Return the processed string
  return result.replace(
    /\[([^\]]+)\]/g,
    (_match, p1) => `<span class="text-yellow-600">${p1}</span>`
  );
}

const options = {
  pre: '[',
  post: ']'
};

interface INovelResult extends INovel {
  processedString: string;
  highlightName: boolean;
}

interface ISearchArgs {
  searchTerm: string;
  novels: INovel[];
}

/**
 * Searches for novels based on a search term.
 *
 * @param {Object} params - The parameters for the search.
 * @param {string} params.searchTerm - The term to search for in novel names and author names.
 * @param {Array<Object>} params.novels - The collection of novels to search through.
 * @returns {INovelResult[]} An array of novel results that match the search term either by name or by author,
 *                           with duplicates removed. Each result includes the original novel object,
 *                           a processed string for display, and a flag indicating whether the match was
 *                           found in the name (true) or author (false).
 */
export function searchHomepage({ searchTerm, novels }: ISearchArgs): INovelResult[] {
  const nameResult = fuzzy.filter(getNormalizedString(searchTerm), novels, {
    ...options,
    extract: function (el) {
      return getNormalizedString(el.novel_name);
    }
  });
  const authorResult = fuzzy.filter(getNormalizedString(searchTerm), novels, {
    ...options,
    extract: function (el) {
      return getNormalizedString(el.novel_author);
    }
  });
  const nameResults = nameResult.map((result) => ({
    ...result.original,
    processedString: processString(result.original.novel_name, result.string),
    highlightName: true
  }));

  const authorResults = authorResult.map((result) => ({
    ...result.original,
    processedString: processString(result.original.novel_author, result.string),
    highlightName: false
  }));

  const combinedResults = [...nameResults, ...authorResults];
  const uniqueResults = Array.from(new Set(combinedResults.map((novel) => novel.id)))
    .map((id) => combinedResults.find((novel) => novel.id === id))
    .filter((novel): novel is INovelResult => Boolean(novel));

  return uniqueResults;
}
