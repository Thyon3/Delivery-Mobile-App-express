/**
 * Order Number Generation Utility
 */

/**
 * Generate unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Validate order number format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  const pattern = /^ORD-\d{13}-[A-Z0-9]{9}$/;
  return pattern.test(orderNumber);
}

/**
 * Extract timestamp from order number
 */
export function extractTimestamp(orderNumber: string): Date | null {
  if (!isValidOrderNumber(orderNumber)) {
    return null;
  }

  const parts = orderNumber.split('-');
  const timestamp = parseInt(parts[1]);
  return new Date(timestamp);
}
