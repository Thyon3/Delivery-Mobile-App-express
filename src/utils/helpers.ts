/**
 * Helper Utility Functions
 */

/**
 * Generate random string
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = generateRandomString(6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Format price
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse pagination params
 */
export function parsePaginationParams(query: any): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build pagination response
 */
export function buildPaginationResponse(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPreviousPage: page > 1,
  };
}

/**
 * Sanitize string (remove special characters)
 */
export function sanitizeString(str: string): string {
  return str.replace(/[^\w\s-]/g, '').trim();
}

/**
 * Generate slug from string
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date): boolean {
  return date < new Date();
}

/**
 * Format date to string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range (start and end of day)
 */
export function getDateRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
