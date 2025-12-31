/**
 * Authentication Validators using Zod
 */

import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['CUSTOMER', 'DRIVER', 'RESTAURANT_OWNER'], {
      errorMap: () => ({ message: 'Invalid role' }),
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});
