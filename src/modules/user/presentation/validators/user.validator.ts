// src/modules/user/presentation/validators/user.validator.ts

import { z } from 'zod';

export const UpdateProfileSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(100, 'First name is too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters')
      .trim()
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(100, 'Last name is too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters')
      .trim()
      .optional(),
  })
  .refine((data) => data.firstName || data.lastName, {
    message: 'At least one field (firstName or lastName) must be provided',
  });

export const ChangeStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended'], {
    errorMap: () => ({ message: 'Status must be one of: active, inactive, suspended' }),
  }),
  reason: z.string().max(500, 'Reason is too long').optional(),
});

export const ListUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending_verification']).optional(),
  emailVerified: z
    .string()
    .optional()
    .transform((val) => (val ? val === 'true' : undefined)),
});

export const UserIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});
