import { z } from 'zod';

export const CurrencyCodeSchema = z.enum([
  'INR',
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'SGD',
  'AED',
  'JPY',
]);

export const GroupCategorySchema = z.enum([
  'trip',
  'home',
  'couple',
  'family',
  'friends',
  'other',
]);

export const SplitTypeSchema = z.enum(['equal', 'exact', 'percentage', 'shares']);

export const ExpenseCategorySchema = z.enum([
  'food_and_drink',
  'groceries',
  'transport',
  'housing',
  'entertainment',
  'travel',
  'utilities',
  'shopping',
  'health',
  'general',
]);

export const SettlementPaymentMethodSchema = z.enum([
  'cash',
  'bank_transfer',
  'upi',
  'other',
]);

// Auth Schemas
export const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  defaultCurrency: CurrencyCodeSchema.default('INR'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const SetupProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  profileImage: z.string().url('Invalid image URL').optional().nullable(),
  defaultCurrency: CurrencyCodeSchema.optional(),
  preferredLanguage: z.enum(['en', 'es', 'fr', 'de', 'hi']).optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
});

// Group Schemas
export const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  category: GroupCategorySchema.default('friends'),
  defaultCurrency: CurrencyCodeSchema.default('INR'),
  imageUrl: z.string().url().optional().nullable(),
  memberUserIds: z.array(z.string().uuid()).optional(),
});

export const UpdateGroupSchema = CreateGroupSchema.partial();

export const AddGroupMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['admin', 'member']).default('member'),
});

// Expense Participant Schema
export const ExpenseParticipantInputSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  allocatedAmountMinor: z.number().int().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().int().min(0).optional(),
});

// Expense Schemas
export const CreateExpenseSchema = z.object({
  title: z.string().min(1, 'Expense title is required').max(150),
  totalAmountMinor: z.number().int().positive('Amount must be greater than 0'),
  currency: CurrencyCodeSchema.default('INR'),
  category: ExpenseCategorySchema.default('general'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Date must be ISO-8601 format'),
  payerId: z.string().uuid('Invalid payer ID'),
  groupId: z.string().uuid().optional().nullable(),
  splitType: SplitTypeSchema.default('equal'),
  notes: z.string().max(1000).optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  participants: z.array(ExpenseParticipantInputSchema).min(1, 'At least 1 participant is required'),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial().extend({
  participants: z.array(ExpenseParticipantInputSchema).optional(),
});

// Settlement Schemas
export const CreateSettlementSchema = z.object({
  payerId: z.string().uuid('Invalid payer ID'),
  receiverId: z.string().uuid('Invalid receiver ID'),
  groupId: z.string().uuid().optional().nullable(),
  amountMinor: z.number().int().positive('Settlement amount must be greater than 0'),
  currency: CurrencyCodeSchema.default('INR'),
  paymentMethod: SettlementPaymentMethodSchema.default('cash'),
  notes: z.string().max(500).optional().nullable(),
});

export const ConfirmSettlementSchema = z.object({
  status: z.enum(['confirmed', 'rejected']),
});

// Friend Schemas
export const SendFriendRequestSchema = z.object({
  emailOrUserId: z.string().min(1, 'Recipient email or ID is required'),
});

export const RespondFriendRequestSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

// Types inferred from Zod schemas
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type SetupProfileInput = z.infer<typeof SetupProfileSchema>;

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>;
export type AddGroupMemberInput = z.infer<typeof AddGroupMemberSchema>;

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

export type CreateSettlementInput = z.infer<typeof CreateSettlementSchema>;
export type ConfirmSettlementInput = z.infer<typeof ConfirmSettlementSchema>;
