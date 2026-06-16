// ============================================================
// MoZhi Academy — General Utilities
// ============================================================

/**
 * Merge class names, filtering out falsy values.
 * Lightweight alternative to clsx / classnames.
 */
export function cn(
  ...classes: (string | false | undefined | null)[]
): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format an ISO date string to a readable Chinese date.
 * e.g. "2026-06-05T14:03:35Z" → "2026年6月5日"
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * Format minutes into a human-readable Chinese duration.
 * e.g. 135 → "2小时15分钟", 45 → "45分钟"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '0分钟';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

/**
 * Mask an API key, keeping a short prefix and suffix visible.
 * e.g. "sk-abcdef1234567890" → "sk-****7890"
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  const prefix = key.slice(0, 3);
  const suffix = key.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * Trigger a browser file download for the given text content.
 */
export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
