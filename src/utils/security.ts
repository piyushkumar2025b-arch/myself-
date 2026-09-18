/**
 * Security & Input Sanitization Utilities
 * Prevents Stored/Reflected XSS, Open Redirects, and URL-based protocol injection.
 */

// Permitted safe URL schemes
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Sanitizes a URL to ensure it does not use malicious pseudo-protocols like javascript: or data:
 * Returns the safe URL string, or a safe fallback ('#' or provided fallback).
 */
export function sanitizeUrl(url?: string | null, fallback: string = '#'): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }

  // Allow internal anchor links (#projects, #contact, etc.)
  if (trimmed.startsWith('#')) {
    return trimmed;
  }

  // Allow relative paths starting with /
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    // Attempt URL parse (handles mailto:, http:, https:, tel:, javascript:, etc.)
    const baseOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3000';
    const parsed = new URL(trimmed, baseOrigin);
    if (SAFE_PROTOCOLS.has(parsed.protocol)) {
      return trimmed;
    }
    // Blocked protocol (e.g. javascript:, data:, vbscript:)
    return fallback;
  } catch {
    // If URL parsing fails, check if it starts with valid http://, https://, or mailto:
    if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
      return trimmed;
    }
    return fallback;
  }
}

/**
 * Helper to generate safe link properties for external and internal anchors.
 * Automatically adds rel="noopener noreferrer" and sanitizes the destination URL.
 */
export function getSafeLinkProps(url?: string | null, defaultTarget: '_blank' | '_self' = '_blank') {
  const safeHref = sanitizeUrl(url);
  const isInternal = safeHref.startsWith('#') || safeHref === '#';
  const target = isInternal ? '_self' : defaultTarget;
  const rel = target === '_blank' ? 'noopener noreferrer' : undefined;

  return {
    href: safeHref,
    target,
    rel,
    isSafe: safeHref !== '#',
  };
}

/**
 * Validates whether an email string adheres to basic standard RFC format.
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Strips dangerous control and non-printable characters.
 */
export function sanitizeInputString(input?: string | null, maxLength: number = 2000): string {
  if (!input || typeof input !== 'string') return '';
  // Strip control characters except newline and tab
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, maxLength)
    .trim();
}
