import { CurrencyCode, SplitType, SUPPORTED_CURRENCIES } from '../types';

export interface CalculatedParticipantShare {
  userId: string;
  allocatedAmountMinor: number;
}

/**
 * Convert user facing float string or number to integer minor units (e.g. 10.50 -> 1050 cents/paise).
 * Protects against 0.1 + 0.2 floating point inaccuracies.
 */
export function toMinorUnits(amount: number | string, currency: CurrencyCode = 'INR'): number {
  const digits = SUPPORTED_CURRENCIES[currency]?.minorUnitDigits ?? 2;
  const factor = Math.pow(10, digits);

  if (typeof amount === 'string') {
    const clean = amount.trim().replace(/,/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return Math.round(num * factor);
  }

  return Math.round(amount * factor);
}

/**
 * Convert integer minor units back to human readable decimal format.
 */
export function fromMinorUnits(minorAmount: number, currency: CurrencyCode = 'INR'): number {
  const digits = SUPPORTED_CURRENCIES[currency]?.minorUnitDigits ?? 2;
  const factor = Math.pow(10, digits);
  return minorAmount / factor;
}

/**
 * Format minor units into localized currency string (e.g. 1050 -> "₹10.50" or "$10.50")
 */
export function formatCurrency(
  minorAmount: number,
  currency: CurrencyCode = 'INR',
  locale = 'en-US'
): string {
  const cfg = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;
  const major = fromMinorUnits(minorAmount, currency);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cfg.code,
    minimumFractionDigits: cfg.minorUnitDigits,
    maximumFractionDigits: cfg.minorUnitDigits,
  }).format(major);
}

/**
 * Calculate Equal Split
 * If 100 minor units are split across 3 people:
 * Base share = floor(100 / 3) = 33
 * Remainder = 100 - (33 * 3) = 1
 * First participant gets 34, others get 33. Sum = 34 + 33 + 33 = 100. Perfect.
 */
export function calculateEqualSplit(
  totalAmountMinor: number,
  userIds: string[]
): CalculatedParticipantShare[] {
  if (userIds.length === 0) return [];
  if (totalAmountMinor < 0) throw new Error('Total amount must be non-negative');

  const count = userIds.length;
  const baseShare = Math.floor(totalAmountMinor / count);
  const remainder = totalAmountMinor - baseShare * count;

  return userIds.map((userId, index) => ({
    userId,
    allocatedAmountMinor: baseShare + (index < remainder ? 1 : 0),
  }));
}

/**
 * Validate and calculate Exact Amount Split
 * Throws if sum of exact amounts does not match total amount.
 */
export function calculateExactSplit(
  totalAmountMinor: number,
  participants: { userId: string; allocatedAmountMinor: number }[]
): CalculatedParticipantShare[] {
  if (participants.length === 0) return [];

  const sum = participants.reduce((acc, p) => acc + p.allocatedAmountMinor, 0);

  if (sum !== totalAmountMinor) {
    const diff = totalAmountMinor - sum;
    throw new Error(
      `Exact split allocations sum to ${sum} minor units, but total expense is ${totalAmountMinor} (difference: ${diff}).`
    );
  }

  return participants.map((p) => ({
    userId: p.userId,
    allocatedAmountMinor: p.allocatedAmountMinor,
  }));
}

/**
 * Calculate Percentage Split
 * Percentages must sum to 100 (within a small tolerance for fractional user inputs, e.g. 33.33 + 33.33 + 33.34 = 100).
 * Remainder minor units are distributed to ensure sum strictly equals totalAmountMinor.
 */
export function calculatePercentageSplit(
  totalAmountMinor: number,
  participants: { userId: string; percentage: number }[]
): CalculatedParticipantShare[] {
  if (participants.length === 0) return [];

  const totalPercentage = participants.reduce((acc, p) => acc + p.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.05) {
    throw new Error(
      `Percentages must total 100%. Currently they total ${totalPercentage.toFixed(2)}%.`
    );
  }

  // Calculate base floored amounts
  let allocatedSum = 0;
  const rawAllocations = participants.map((p) => {
    const share = Math.floor((totalAmountMinor * p.percentage) / 100);
    allocatedSum += share;
    return {
      userId: p.userId,
      baseAmount: share,
      fractionalRemainder: (totalAmountMinor * p.percentage) / 100 - share,
    };
  });

  let remainingMinor = totalAmountMinor - allocatedSum;

  // Sort by highest fractional remainder and distribute leftover cents
  const sorted = [...rawAllocations].sort(
    (a, b) => b.fractionalRemainder - a.fractionalRemainder
  );

  const bonusMap = new Map<string, number>();
  for (let i = 0; i < remainingMinor; i++) {
    const p = sorted[i % sorted.length];
    bonusMap.set(p.userId, (bonusMap.get(p.userId) || 0) + 1);
  }

  return participants.map((p) => {
    const base = rawAllocations.find((r) => r.userId === p.userId)!.baseAmount;
    const bonus = bonusMap.get(p.userId) || 0;
    return {
      userId: p.userId,
      allocatedAmountMinor: base + bonus,
    };
  });
}

/**
 * Calculate Share-based Split (e.g. Alice: 2 shares, Bob: 1 share, Charlie: 1 share)
 * Total shares = 4.
 * Residual minor units distributed to the highest fraction holders.
 */
export function calculateShareBasedSplit(
  totalAmountMinor: number,
  participants: { userId: string; shares: number }[]
): CalculatedParticipantShare[] {
  if (participants.length === 0) return [];

  const totalShares = participants.reduce((acc, p) => acc + p.shares, 0);
  if (totalShares <= 0) {
    throw new Error('Total shares must be greater than zero.');
  }

  let allocatedSum = 0;
  const rawAllocations = participants.map((p) => {
    const exact = (totalAmountMinor * p.shares) / totalShares;
    const base = Math.floor(exact);
    allocatedSum += base;
    return {
      userId: p.userId,
      baseAmount: base,
      fraction: exact - base,
    };
  });

  const remainingMinor = totalAmountMinor - allocatedSum;
  const sorted = [...rawAllocations].sort((a, b) => b.fraction - a.fraction);

  const bonusMap = new Map<string, number>();
  for (let i = 0; i < remainingMinor; i++) {
    const p = sorted[i % sorted.length];
    bonusMap.set(p.userId, (bonusMap.get(p.userId) || 0) + 1);
  }

  return participants.map((p) => {
    const base = rawAllocations.find((r) => r.userId === p.userId)!.baseAmount;
    const bonus = bonusMap.get(p.userId) || 0;
    return {
      userId: p.userId,
      allocatedAmountMinor: base + bonus,
    };
  });
}

/**
 * Universal split resolver dispatcher
 */
export function resolveSplit(
  splitType: SplitType,
  totalAmountMinor: number,
  inputs: {
    userId: string;
    allocatedAmountMinor?: number;
    percentage?: number;
    shares?: number;
  }[]
): CalculatedParticipantShare[] {
  switch (splitType) {
    case 'equal':
      return calculateEqualSplit(
        totalAmountMinor,
        inputs.map((p) => p.userId)
      );

    case 'exact':
      return calculateExactSplit(
        totalAmountMinor,
        inputs.map((p) => ({
          userId: p.userId,
          allocatedAmountMinor: p.allocatedAmountMinor ?? 0,
        }))
      );

    case 'percentage':
      return calculatePercentageSplit(
        totalAmountMinor,
        inputs.map((p) => ({
          userId: p.userId,
          percentage: p.percentage ?? 0,
        }))
      );

    case 'shares':
      return calculateShareBasedSplit(
        totalAmountMinor,
        inputs.map((p) => ({
          userId: p.userId,
          shares: p.shares ?? 1,
        }))
      );

    default:
      throw new Error(`Unsupported split type: ${splitType}`);
  }
}
