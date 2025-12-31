/**
 * OTP Utility Functions
 */

/**
 * Generate numeric OTP
 */
export function generateOTP(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Generate alphanumeric OTP
 */
export function generateAlphanumericOTP(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return otp;
}

/**
 * Validate OTP format
 */
export function isValidOTP(otp: string, length: number = 6): boolean {
  const regex = new RegExp(`^[0-9]{${length}}$`);
  return regex.test(otp);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(createdAt: Date, validityMinutes: number = 10): boolean {
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  return diffMinutes > validityMinutes;
}
