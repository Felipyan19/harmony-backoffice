import { jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  displayName: text('display_name').notNull(),
  phone: text('phone'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const authIdentities = pgTable('auth_identities', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  provider: text('provider').notNull(),
  subject: text('subject').notNull(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name'),
  description: text('description'),
});

export const profileRoles = pgTable('profile_roles', {
  profileId: uuid('profile_id').notNull(),
  roleId: uuid('role_id').notNull(),
  assignedBy: uuid('assigned_by'),
}, (table) => [primaryKey({ columns: [table.profileId, table.roleId] })]);

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull(),
  permissionId: uuid('permission_id').notNull(),
}, (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey(),
  actorProfileId: uuid('actor_profile_id'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
