/**
 * Driver Validators using Zod
 */

import { z } from 'zod';

export const completeDriverRegistrationSchema = z.object({
  body: z.object({
    licenseNumber: z.string().min(1, 'License number is required'),
    vehicleType: z.enum(['BIKE', 'SCOOTER', 'CAR', 'BICYCLE'], {
      errorMap: () => ({ message: 'Invalid vehicle type' }),
    }),
    vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  }),
});

export const updateDriverStatusSchema = z.object({
  body: z.object({
    status: z.enum(['OFFLINE', 'ONLINE', 'BUSY', 'ON_BREAK'], {
      errorMap: () => ({ message: 'Invalid driver status' }),
    }),
    isAvailable: z.boolean().optional(),
  }),
});
