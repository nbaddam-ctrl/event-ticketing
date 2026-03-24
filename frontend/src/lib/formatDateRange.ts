/**
 * Format a date range for display.
 *
 * - No startAt → "TBA"
 * - No endAt or same instant → single date (e.g., "Mar 24, 2026")
 * - Same day → date with time range (e.g., "Mar 24, 2026 · 6:00 PM – 10:00 PM")
 * - Multi-day → date range (e.g., "Mar 24 – Mar 26, 2026")
 */
export function formatDateRange(startAt?: string, endAt?: string): string {
  if (!startAt) return 'TBA';

  const start = new Date(startAt);

  if (!endAt || endAt === startAt) {
    return start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const end = new Date(endAt);

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    const datePart = start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const startTime = start.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    const endTime = end.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${datePart} · ${startTime} – ${endTime}`;
  }

  // Multi-day: "Mar 24 – Mar 26, 2026" (or across years: "Dec 31, 2026 – Jan 2, 2027")
  const sameYear = start.getFullYear() === end.getFullYear();
  const startPart = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const endPart = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startPart} – ${endPart}`;
}
