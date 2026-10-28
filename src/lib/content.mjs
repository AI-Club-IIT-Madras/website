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

/**
 * Events remain active through their end time, or the end of their final day in India.
 * Use endDate for multi-day events and endsAt for a precise ISO timestamp with offset.
 * @param {{date?: string | null, endDate?: string | null, endsAt?: string | null}} event
 */
export function eventEndTime(event) {
  const date = event.endDate || event.date;
  return event.endsAt ? Date.parse(event.endsAt)
    : date ? Date.parse(`${date}T23:59:59.999+05:30`) : NaN;
}

/** @param {{date?: string | null, endDate?: string | null, endsAt?: string | null}} event @param {number} now */
export function isActiveEvent(event, now = Date.now()) {
  return eventEndTime(event) > now;
}

/**
 * Upcoming/ongoing events: soonest first. Past events: newest first; undated archives last.
 * @template {{id: string, status: string, date: string | null, endDate?: string | null, endsAt?: string | null}} T
 * @param {T[]} records
 * @param {number} now
 */
export function partitionEvents(records, now = Date.now()) {
  const published = records.filter(event => event.status === 'published');
  return {
    upcoming: published.filter(event => isActiveEvent(event, now))
      .toSorted((a, b) => (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id)),
    past: published.filter(event => !isActiveEvent(event, now))
      .toSorted((a, b) => (b.date || '').localeCompare(a.date || '') || a.id.localeCompare(b.id)),
  };
}
