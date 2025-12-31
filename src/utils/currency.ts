/**
 * Currency Utility Functions
 */

/**
 * Format amount as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert amount to cents
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents to amount
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Calculate tax
 */
export function calculateTax(amount: number, taxRate: number): number {
  return Math.round(amount * taxRate * 100) / 100;
}

/**
 * Calculate discount
 */
export function calculateDiscount(amount: number, discountPercent: number): number {
  return Math.round(amount * (discountPercent / 100) * 100) / 100;
}

/**
 * Apply discount to amount
 */
export function applyDiscount(amount: number, discountPercent: number): number {
  const discount = calculateDiscount(amount, discountPercent);
  return amount - discount;
}
