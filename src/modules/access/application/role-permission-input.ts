import { z } from 'zod';

const roleCodeSchema = z.enum(['admin', 'agent', 'receptionist']);

const permissionCodeSchema = z.enum([
  'customers.read',
  'customers.write',
  'conversations.read',
  'conversations.reply',
  'conversations.assign',
  'conversations.manage_status',
  'users.read',
  'users.manage',
  'roles.manage',
  'audit.read',
  'reservations.manage',
]);

export const updateRolePermissionsSchema = z.object({
  roleCode: roleCodeSchema,
  permissions: z.array(permissionCodeSchema),
});

export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
