/** Days are local calendar dates as 'YYYY-MM-DD'. Arithmetic goes through UTC midnights, so DST never shifts a day. */

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(ms: number = Date.now()): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toUtc(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y as number, (m as number) - 1, d as number);
}

export function addDays(day: string, n: number): string {
  const d = new Date(toUtc(day) + n * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(day: string): number {
  return (new Date(toUtc(day)).getUTCDay() + 6) % 7;
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** Start of a local day in epoch ms. */
export function startOfDayMs(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y as number, (m as number) - 1, d as number).getTime();
}

/** The last n days ending today, oldest first. */
export function lastNDays(n: number, today: string = dayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

/** Monday of the week containing `day`. */
export function weekStart(day: string): string {
  return addDays(day, -weekdayIndex(day));
}
