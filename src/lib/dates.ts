// Role dates and durations, ported from design/Main.dc.html.
// Months are counted inclusively (start month through end month), the same way LinkedIn
// does it: Jun 2020 to Nov 2023 is 3 yrs 6 mos.
// Used at build time by the templates and in the browser by src/scripts/site.ts, which
// recomputes open-ended (Present) durations so they never go stale.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Month index (year * 12 + month - 1) for a YYYY-MM string. */
export function monthIndex(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + m - 1;
}

export function currentMonthIndex(now = new Date()): number {
  return now.getFullYear() * 12 + now.getMonth();
}

/** "Jun 2020" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "Jun 2020 – Nov 2023" or "Sep 2026 – Present" */
export function dateRange(start: string, end: string | null): string {
  return `${monthLabel(start)} – ${end ? monthLabel(end) : 'Present'}`;
}

/** "3 yrs 6 mos", inclusive of both months. */
export function duration(start: string, end: string | null, now = new Date()): string {
  const n = (end ? monthIndex(end) : currentMonthIndex(now)) - monthIndex(start) + 1;
  const y = Math.floor(n / 12);
  const m = n % 12;
  const out: string[] = [];
  if (y > 0) out.push(`${y} ${y > 1 ? 'yrs' : 'yr'}`);
  if (m > 0) out.push(`${m} ${m > 1 ? 'mos' : 'mo'}`);
  return out.join(' ');
}

/** Earliest start and latest end (null if any role is current) across roles. */
export function tenureSpan(roles: { start: string; end: string | null }[]) {
  const start = roles.map((r) => r.start).sort()[0];
  const end = roles.some((r) => r.end === null) ? null : roles.map((r) => r.end as string).sort().at(-1)!;
  return { start, end };
}

/** "August 28, 2025" from a date parsed at UTC midnight. */
export function longDate(d: Date): string {
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
}
