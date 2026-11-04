export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'SGD' | 'AED' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  minorUnitDigits: number; // e.g. 2 for cents/paise, 0 for JPY
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', minorUnitDigits: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', minorUnitDigits: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', minorUnitDigits: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', minorUnitDigits: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', minorUnitDigits: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', minorUnitDigits: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', minorUnitDigits: 2 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', minorUnitDigits: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', minorUnitDigits: 0 },
};

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'hi';

export interface User {
  id: string;
  email: string;
  fullName: string;
  profileImage?: string | null;
  defaultCurrency: CurrencyCode;
  preferredLanguage: LanguageCode;
  themePreference: 'light' | 'dark' | 'system';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileSetupDto {
  fullName: string;
  profileImage?: string;
  defaultCurrency?: CurrencyCode;
  preferredLanguage?: LanguageCode;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  sender?: User;
  receiver?: User;
  createdAt: string;
}

export interface Friend {
  id: string; // friend's user id
  friendshipId: string;
  fullName: string;
  email: string;
  profileImage?: string | null;
  netBalanceMinor: number; // relative to current user: positive = they owe you, negative = you owe them
  currency: CurrencyCode;
  createdAt: string;
}

export type GroupCategory = 'trip' | 'home' | 'couple' | 'family' | 'friends' | 'other';
export type GroupRole = 'admin' | 'member';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string | null;
  };
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category: GroupCategory;
  defaultCurrency: CurrencyCode;
  createdById: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  membersCount?: number;
  totalExpensesMinor?: number;
  userNetBalanceMinor?: number; // relative to logged in user
  members?: GroupMember[];
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export type ExpenseCategory =
  | 'food_and_drink'
  | 'groceries'
  | 'transport'
  | 'housing'
  | 'entertainment'
  | 'travel'
  | 'utilities'
  | 'shopping'
  | 'health'
  | 'general';

export interface ExpenseParticipantInput {
  userId: string;
  allocatedAmountMinor?: number;
  percentage?: number; // e.g. 33.33
  shares?: number; // e.g. 1, 2
}

export interface ExpenseParticipant {
  id: string;
  expenseId: string;
  userId: string;
  allocatedAmountMinor: number;
  splitType: SplitType;
  splitValue?: number | null; // stores percentage or shares if applicable
  user?: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string | null;
  };
}

export interface Expense {
  id: string;
  title: string;
  totalAmountMinor: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  date: string;
  payerId: string;
  groupId?: string | null;
  splitType: SplitType;
  notes?: string | null;
  receiptUrl?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  payer?: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string | null;
  };
  group?: {
    id: string;
    name: string;
    category: GroupCategory;
  } | null;
  participants: ExpenseParticipant[];
}

export type SettlementPaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'other';
export type SettlementStatus = 'pending' | 'confirmed' | 'rejected';

export interface Settlement {
  id: string;
  payerId: string;
  receiverId: string;
  groupId?: string | null;
  amountMinor: number;
  currency: CurrencyCode;
  paymentMethod: SettlementPaymentMethod;
  notes?: string | null;
  status: SettlementStatus;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  payer?: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string | null;
  };
  receiver?: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string | null;
  };
  group?: {
    id: string;
    name: string;
  } | null;
}

export interface DebtRelation {
  fromUserId: string; // debtor
  toUserId: string; // creditor
  amountMinor: number;
  currency: CurrencyCode;
  fromUser?: { id: string; fullName: string; profileImage?: string | null };
  toUser?: { id: string; fullName: string; profileImage?: string | null };
}

export interface UserBalanceOverview {
  totalBalanceMinor: number; // positive = net owed to you, negative = you owe overall
  totalYouOweMinor: number;
  totalOwedToYouMinor: number;
  activeGroupsCount: number;
  currency: CurrencyCode;
  youOweList: DebtRelation[];
  owedToYouList: DebtRelation[];
}

export type ActivityType =
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'settlement_created'
  | 'settlement_confirmed'
  | 'settlement_rejected'
  | 'group_created'
  | 'member_joined'
  | 'member_removed'
  | 'friend_request_sent'
  | 'friend_request_accepted';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  actorImage?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type NotificationType =
  | 'group_invitation'
  | 'friend_request'
  | 'expense_added'
  | 'expense_updated'
  | 'settlement_requested'
  | 'settlement_confirmed'
  | 'group_member_changed';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  expenseAlerts: boolean;
  settlementAlerts: boolean;
  friendRequests: boolean;
  groupUpdates: boolean;
}

export interface AnalyticsSummary {
  period: 'month' | 'year' | 'all';
  currency: CurrencyCode;
  totalSpentMinor: number;
  totalSharedMinor: number;
  netSavingsMinor: number;
  categoryBreakdown: {
    category: ExpenseCategory;
    categoryLabel: string;
    totalAmountMinor: number;
    percentage: number;
  }[];
  groupBreakdown: {
    groupId: string;
    groupName: string;
    totalAmountMinor: number;
    userShareMinor: number;
  }[];
  monthlyTrends: {
    month: string; // e.g. "2026-01"
    label: string; // e.g. "Jan 2026"
    amountMinor: number;
  }[];
}
