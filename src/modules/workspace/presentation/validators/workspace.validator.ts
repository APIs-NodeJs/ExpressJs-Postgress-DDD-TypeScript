// src/modules/workspace/presentation/validators/workspace.validator.ts

import { z } from 'zod';

export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, 'Workspace name must be at least 3 characters')
    .max(100, 'Workspace name is too long')
    .regex(/^[a-zA-Z0-9\s\-_']+$/, 'Workspace name contains invalid characters')
    .trim(),
  description: z.string().max(500, 'Description is too long').trim().optional(),
});

export const AddMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  role: z.enum(['admin', 'member', 'guest'], {
    errorMap: () => ({ message: 'Role must be one of: admin, member, guest' }),
  }),
});

export const InviteMemberSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  role: z.enum(['admin', 'member', 'guest'], {
    errorMap: () => ({ message: 'Role must be one of: admin, member, guest' }),
  }),
});

export const UpdateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, 'Workspace name must be at least 3 characters')
    .max(100, 'Workspace name is too long')
    .regex(/^[a-zA-Z0-9\s\-_']+$/, 'Workspace name contains invalid characters')
    .trim()
    .optional(),
  description: z.string().max(500, 'Description is too long').trim().optional(),
});

export const ChangeRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'guest'], {
    errorMap: () => ({ message: 'Role must be one of: owner, admin, member, guest' }),
  }),
});

export const WorkspaceIdParamSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID format'),
});

export const InvitationTokenParamSchema = z.object({
  token: z.string().uuid('Invalid invitation token format'),
});

export const UserIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export const WorkspaceSlugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});
