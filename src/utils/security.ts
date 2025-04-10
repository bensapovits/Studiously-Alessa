import DOMPurify from 'dompurify';

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}