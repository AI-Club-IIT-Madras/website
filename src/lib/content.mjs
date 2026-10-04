/**
 * Shared sorting keeps homepage previews and archives in the same order.
 * @template {{status: string, date: string | null, id: string}} T
 * @param {T[]} records
 * @returns {T[]}
 */
export function newestPublished(records) {
  return records.filter(record => record.status === 'published' && record.date)
    .toSorted((a, b) => (b.date || '').localeCompare(a.date || '') || a.id.localeCompare(b.id));
}

/** @template {{status: string, date: string | null, id: string}} T @param {T[]} records */
export function groupByYear(records) {
  const sorted = newestPublished(records);
  return [...new Set(sorted.map(record => record.date.slice(0, 4)))]
    .map(year => ({ year, records: sorted.filter(record => record.date.startsWith(year)) }));
}

/** @param {{readingMinutes?: number | null, wordCount?: number | null}} article */
export function readingMinutes(article) {
  if (article.readingMinutes > 0) return article.readingMinutes;
  if (article.wordCount > 0) return Math.max(1, Math.ceil(article.wordCount / 200));
  return null;
}
