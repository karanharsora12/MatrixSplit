import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    profileImage: text('profile_image'),
    defaultCurrency: varchar('default_currency', { length: 10 }).notNull().default('INR'),
    preferredLanguage: varchar('preferred_language', { length: 10 }).notNull().default('en'),
    themePreference: varchar('theme_preference', { length: 10 }).notNull().default('system'),
    isEmailVerified: boolean('is_email_verified').notNull().default(false),
    verificationOtp: varchar('verification_otp', { length: 6 }),
    resetPasswordOtp: varchar('reset_password_otp', { length: 6 }),
    resetPasswordExpiresAt: timestamp('reset_password_expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// User Sessions table (Refresh tokens)
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 50 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Friend Requests table
export const friendRequests = pgTable(
  'friend_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'accepted', 'rejected'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    senderReceiverIdx: uniqueIndex('friend_requests_sender_receiver_idx').on(table.senderId, table.receiverId),
  })
);

// Friendships table
export const friendships = pgTable(
  'friendships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user1Id: uuid('user1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    user2Id: uuid('user2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    pairIdx: uniqueIndex('friendships_user_pair_idx').on(table.user1Id, table.user2Id),
  })
);

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  category: varchar('category', { length: 50 }).notNull().default('friends'),
  defaultCurrency: varchar('default_currency', { length: 10 }).notNull().default('INR'),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  inviteCode: varchar('invite_code', { length: 32 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Group Members table
export const groupMembers = pgTable(
  'group_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull().default('member'), // 'admin' | 'member'
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (table) => ({
    groupUserIdx: uniqueIndex('group_members_group_user_idx').on(table.groupId, table.userId),
  })
);

// Group Invitations table
export const groupInvitations = pgTable('group_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  inviteCode: varchar('invite_code', { length: 64 }).notNull().unique(),
  maxUses: integer('max_uses').default(100),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Expenses table (The source of financial truth)
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    totalAmountMinor: integer('total_amount_minor').notNull(), // Integer cents/paise
    currency: varchar('currency', { length: 10 }).notNull().default('INR'),
    category: varchar('category', { length: 50 }).notNull().default('general'),
    date: timestamp('date').notNull(),
    payerId: uuid('payer_id').notNull().references(() => users.id),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
    splitType: varchar('split_type', { length: 30 }).notNull().default('equal'), // equal, exact, percentage, shares
    notes: text('notes'),
    receiptUrl: text('receipt_url'),
    createdById: uuid('created_by_id').notNull().references(() => users.id),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    groupIdx: index('expenses_group_idx').on(table.groupId),
    payerIdx: index('expenses_payer_idx').on(table.payerId),
    dateIdx: index('expenses_date_idx').on(table.date),
  })
);

// Expense Participants table
export const expenseParticipants = pgTable(
  'expense_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id),
    allocatedAmountMinor: integer('allocated_amount_minor').notNull(),
    splitType: varchar('split_type', { length: 30 }).notNull(),
    splitValue: numeric('split_value', { precision: 10, scale: 2 }), // stores percentage or shares
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    expenseUserIdx: index('expense_participants_expense_user_idx').on(table.expenseId, table.userId),
  })
);

// Settlements table
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    payerId: uuid('payer_id').notNull().references(() => users.id),
    receiverId: uuid('receiver_id').notNull().references(() => users.id),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
    amountMinor: integer('amount_minor').notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('INR'),
    paymentMethod: varchar('payment_method', { length: 30 }).notNull().default('cash'), // cash, bank_transfer, upi, other
    notes: text('notes'),
    status: varchar('status', { length: 20 }).notNull().default('confirmed'), // pending, confirmed, rejected
    confirmedAt: timestamp('confirmed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    payerIdx: index('settlements_payer_idx').on(table.payerId),
    receiverIdx: index('settlements_receiver_idx').on(table.receiverId),
    groupIdx: index('settlements_group_idx').on(table.groupId),
  })
);

// Activities table
export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 50 }).notNull(),
    actorId: uuid('actor_id').notNull().references(() => users.id),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    groupIdx: index('activities_group_idx').on(table.groupId),
    actorIdx: index('activities_actor_idx').on(table.actorId),
    createdAtIdx: index('activities_created_at_idx').on(table.createdAt),
  })
);

// Notifications table
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId),
  })
);

// Attachments table (Receipts, images)
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseId: uuid('expense_id').references(() => expenses.id, { onDelete: 'set null' }),
  uploaderId: uuid('uploader_id').notNull().references(() => users.id),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  groupMemberships: many(groupMembers),
  expensesPaid: many(expenses, { relationName: 'payer' }),
  expenseShares: many(expenseParticipants),
  settlementsPaid: many(settlements, { relationName: 'payer' }),
  settlementsReceived: many(settlements, { relationName: 'receiver' }),
  notifications: many(notifications),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  createdBy: one(users, { fields: [groups.createdById], references: [users.id] }),
  members: many(groupMembers),
  expenses: many(expenses),
  settlements: many(settlements),
  activities: many(activities),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  payer: one(users, { fields: [expenses.payerId], references: [users.id] }),
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  participants: many(expenseParticipants),
  attachments: many(attachments),
}));

export const expenseParticipantsRelations = relations(expenseParticipants, ({ one }) => ({
  expense: one(expenses, { fields: [expenseParticipants.expenseId], references: [expenses.id] }),
  user: one(users, { fields: [expenseParticipants.userId], references: [users.id] }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  payer: one(users, { fields: [settlements.payerId], references: [users.id], relationName: 'payer' }),
  receiver: one(users, { fields: [settlements.receiverId], references: [users.id], relationName: 'receiver' }),
  group: one(groups, { fields: [settlements.groupId], references: [groups.id] }),
}));
