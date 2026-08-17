import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  sessionVersion: integer('session_version').default(1).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('users_email_unique_idx').on(sql`lower(${table.email})`)]);

export const passwordCredentials = pgTable('password_credentials', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }).defaultNow().notNull(),
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
  failedAttempts: integer('failed_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  phone: text('phone'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('profiles_user_id_key').on(table.userId)]);

/** Legacy table kept temporarily for rollback/audit only. Runtime authentication no longer reads it. */
export const authIdentities = pgTable('auth_identities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  provider: text('provider').notNull(),
  subject: text('subject').notNull(),
}, (table) => [
  uniqueIndex('auth_identities_provider_subject_key').on(table.provider, table.subject),
  uniqueIndex('auth_identities_user_provider_key').on(table.userId, table.provider),
]);

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [uniqueIndex('roles_code_key').on(table.code)]);

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull(),
  name: text('name'),
  description: text('description'),
}, (table) => [uniqueIndex('permissions_code_key').on(table.code)]);

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
  id: uuid('id').defaultRandom().primaryKey(),
  actorProfileId: uuid('actor_profile_id'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  notes: text('notes'),
  tags: text('tags').array().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
});

export const conversationLabels = pgTable('conversation_labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').default('zinc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('conversation_labels_name_unique_idx').on(sql`lower(${table.name})`)]);

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull(),
  channel: text('channel').default('whatsapp').notNull(),
  externalId: text('external_id'),
  status: text('status').default('open').notNull(),
  assignedTo: uuid('assigned_to'),
  unreadCount: integer('unread_count').default(0).notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const conversationLabelAssignments = pgTable('conversation_label_assignments', {
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  labelId: uuid('label_id').notNull().references(() => conversationLabels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.conversationId, table.labelId] }),
  index('conversation_label_assignments_label_id_idx').on(table.labelId, table.conversationId),
]);

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull(),
  externalId: text('external_id'),
  direction: text('direction').notNull(),
  senderType: text('sender_type').notNull(),
  senderProfileId: uuid('sender_profile_id'),
  senderName: text('sender_name'),
  content: text('content').notNull(),
  status: text('status').default('sent').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
