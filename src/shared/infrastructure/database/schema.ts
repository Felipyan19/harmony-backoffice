import { boolean, foreignKey, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
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
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: uuid('assigned_by').references(() => profiles.id, { onDelete: 'set null' }),
}, (table) => [primaryKey({ name: 'profile_roles_pk', columns: [table.profileId, table.roleId] })]);

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ name: 'role_permissions_pk', columns: [table.roleId, table.permissionId] })]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorProfileId: uuid('actor_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
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
  // Kept temporarily for backward compatibility. New code should use customerTags/customerTagAssignments.
  tags: text('tags').array().default(sql`'{}'::text[]`).notNull(),
  customAttributes: jsonb('custom_attributes').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
}, (table) => [
  index('customers_phone_idx').on(table.phone),
  index('customers_email_lower_idx').on(sql`lower(${table.email})`),
]);

export const channels = pgTable('channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(),
  provider: text('provider').default('meta').notNull(),
  name: text('name').notNull(),
  externalId: text('external_id'),
  phone: text('phone'),
  status: text('status').default('active').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('channels_type_external_id_unique_idx').on(table.type, table.externalId).where(sql`${table.externalId} is not null`),
  index('channels_status_idx').on(table.status),
]);

export const customerChannels = pgTable('customer_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  externalCustomerId: text('external_customer_id').notNull(),
  address: text('address'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('customer_channels_channel_external_unique_idx').on(table.channelId, table.externalCustomerId),
  index('customer_channels_customer_id_idx').on(table.customerId),
]);

export const customerTags = pgTable('customer_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').default('zinc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('customer_tags_name_unique_idx').on(sql`lower(${table.name})`)]);

export const customerTagAssignments = pgTable('customer_tag_assignments', {
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => customerTags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ name: 'customer_tag_assignments_pk', columns: [table.customerId, table.tagId] }),
  index('customer_tag_assignments_tag_id_idx').on(table.tagId, table.customerId),
]);

export const conversationLabels = pgTable('conversation_labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').default('zinc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('conversation_labels_name_unique_idx').on(sql`lower(${table.name})`)]);

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  customerChannelId: uuid('customer_channel_id').references(() => customerChannels.id, { onDelete: 'set null' }),
  channel: text('channel').default('whatsapp').notNull(),
  externalId: text('external_id'),
  status: text('status').default('open').notNull(),
  priority: text('priority').default('normal').notNull(),
  assignedTo: uuid('assigned_to').references(() => profiles.id, { onDelete: 'set null' }),
  unreadCount: integer('unread_count').default(0).notNull(),
  firstReplyAt: timestamp('first_reply_at', { withTimezone: true }),
  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }).defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('conversations_customer_id_idx').on(table.customerId),
  index('conversations_customer_channel_id_idx').on(table.customerChannelId),
  index('conversations_status_last_message_idx').on(table.status, table.lastMessageAt),
  index('conversations_assigned_status_last_message_idx').on(table.assignedTo, table.status, table.lastMessageAt),
  uniqueIndex('conversations_customer_channel_external_unique_idx')
    .on(table.customerChannelId, table.externalId)
    .where(sql`${table.customerChannelId} is not null and ${table.externalId} is not null`),
]);

export const conversationLabelAssignments = pgTable('conversation_label_assignments', {
  conversationId: uuid('conversation_id').notNull(),
  labelId: uuid('label_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ name: 'conversation_label_assignments_pk', columns: [table.conversationId, table.labelId] }),
  index('conversation_label_assignments_label_id_idx').on(table.labelId, table.conversationId),
  foreignKey({
    name: 'conversation_label_assignments_conversation_id_fk',
    columns: [table.conversationId],
    foreignColumns: [conversations.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'conversation_label_assignments_label_id_fk',
    columns: [table.labelId],
    foreignColumns: [conversationLabels.id],
  }).onDelete('cascade'),
]);

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  externalId: text('external_id'),
  direction: text('direction').notNull(),
  senderType: text('sender_type').notNull(),
  senderProfileId: uuid('sender_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  senderName: text('sender_name'),
  content: text('content').notNull(),
  contentType: text('content_type').default('text').notNull(),
  status: text('status').default('sent').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  replyToMessageId: uuid('reply_to_message_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('messages_conversation_created_at_idx').on(table.conversationId, table.createdAt),
  uniqueIndex('messages_conversation_external_id_unique_idx')
    .on(table.conversationId, table.externalId)
    .where(sql`${table.externalId} is not null`),
  foreignKey({
    name: 'messages_reply_to_message_id_fk',
    columns: [table.replyToMessageId],
    foreignColumns: [table.id],
  }).onDelete('set null'),
]);

export const messageAttachments = pgTable('message_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  mimeType: text('mime_type'),
  fileName: text('file_name'),
  url: text('url'),
  storageKey: text('storage_key'),
  sizeBytes: integer('size_bytes'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('message_attachments_message_id_idx').on(table.messageId)]);

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(),
  externalEventId: text('external_event_id').notNull(),
  eventType: text('event_type').notNull(),
  status: text('status').default('received').notNull(),
  payload: jsonb('payload').default({}).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('webhook_events_provider_external_event_unique_idx').on(table.provider, table.externalEventId),
  index('webhook_events_status_created_at_idx').on(table.status, table.createdAt),
]);
