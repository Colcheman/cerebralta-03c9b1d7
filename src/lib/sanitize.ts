/**
 * Sanitize user input text to prevent XSS and injection attacks.
 * Strips HTML tags, trims whitespace, and enforces length limits.
 */
export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>]/g, "") // Remove remaining angle brackets
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate hex color input strictly.
 */
export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Sanitize a URL to prevent javascript: protocol attacks.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return trimmed;
  } catch {
    return "";
  }
}
