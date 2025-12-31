/**
 * Phone Number Utility Functions
 */

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string, countryCode: string = '+1'): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (!phone.startsWith('+')) {
    return `${countryCode}${cleaned}`;
  }
  
  return `+${cleaned}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Extract country code from phone number
 */
export function extractCountryCode(phone: string): string | null {
  const match = phone.match(/^\+(\d{1,3})/);
  return match ? `+${match[1]}` : null;
}

/**
 * Mask phone number for display
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return phone;
  
  const visible = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4);
  return masked + visible;
}
