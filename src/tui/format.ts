export function bar(fraction: number, width: number): string {
  const safe = Number.isFinite(fraction)
    ? Math.min(1, Math.max(0, fraction))
    : 0;
  const filled = Math.round(safe * width);
  return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
}

export function percent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits).replace(".", ",")}%`;
}

// "2026-10-07" -> "07/10"
export function shortDate(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function clampCursor(cursor: number, length: number): number {
  return Math.max(0, Math.min(cursor, length - 1));
}

// Window of `size` items that keeps the cursor roughly centered.
export function visibleWindow(length: number, cursor: number, size: number) {
  if (size <= 0 || length <= 0) return { start: 0, end: 0 };
  const start = Math.max(
    0,
    Math.min(cursor - Math.floor(size / 2), length - size),
  );
  return { start, end: Math.min(length, start + size) };
}

// Colors are dropped when NO_COLOR is set (https://no-color.org).
export function tint(color?: string): string | undefined {
  return process.env.NO_COLOR ? undefined : color;
}
