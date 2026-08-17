import { z } from 'zod';

const roleSchema = z.enum(['admin', 'agent', 'receptionist']);

export const createUserSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(40).optional(),
  roles: z.array(roleSchema).min(1),
});

export const updateUserSchema = z.object({
  userId: z.uuid(),
  displayName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  status: z.enum(['active', 'disabled']),
  roles: z.array(roleSchema).min(1),
});

export const deleteUserSchema = z.object({
  userId: z.uuid(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
