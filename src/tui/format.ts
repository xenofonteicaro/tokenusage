export function bar(fraction: number, width: number): string {
  const safe = Number.isFinite(fraction)
    ? Math.min(1, Math.max(0, fraction))
    : 0;
  const filled = Math.round(safe * width);
  return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
}

// "2026-10-07" -> "07/10" (day first) or "10/07" for English.
export function shortDate(day: string, language = "pt-BR"): string {
  const [, month, date] = day.split("-");
  return language === "en" ? `${month}/${date}` : `${date}/${month}`;
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
