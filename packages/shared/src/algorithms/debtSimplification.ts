import { CurrencyCode, DebtRelation } from '../types';

export interface UserNetPosition {
  userId: string;
  netAmountMinor: number; // positive = creditor (is owed), negative = debtor (owes)
}

/**
 * Greedily simplifies debts to minimize total transactions across a network of people.
 * Transforms an arbitrary directed debt graph with cycles into an acyclic minimum-edge settlement plan.
 *
 * Guaranteed properties:
 * 1. Conservation of money: Sum of debts paid equals sum of debts collected.
 * 2. Minimized transactions: Requires at most N - 1 transactions for N participants.
 * 3. Eliminates intermediate hops (A -> B and B -> C becomes A -> C).
 */
export function simplifyDebts(
  netPositions: UserNetPosition[],
  currency: CurrencyCode = 'INR'
): DebtRelation[] {
  // Filter out users who have a zero net balance
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const pos of netPositions) {
    if (pos.netAmountMinor < 0) {
      debtors.push({ userId: pos.userId, amount: -pos.netAmountMinor }); // positive debt amount
    } else if (pos.netAmountMinor > 0) {
      creditors.push({ userId: pos.userId, amount: pos.netAmountMinor });
    }
  }

  // Sanity check: sum of debtor amounts must roughly equal sum of creditor amounts
  const totalDebt = debtors.reduce((acc, d) => acc + d.amount, 0);
  const totalCredit = creditors.reduce((acc, c) => acc + c.amount, 0);
  if (totalDebt !== totalCredit) {
    // If there is an imbalance, we adjust or warn; but in a closed system it must equal
    const diff = totalDebt - totalCredit;
    if (Math.abs(diff) > 1) {
      console.warn(`Imbalanced net positions: totalDebt=${totalDebt}, totalCredit=${totalCredit}`);
    }
  }

  const transactions: DebtRelation[] = [];

  // Sort descending by amount to prioritize pairing largest debtor with largest creditor
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    if (debtor.amount === 0) {
      dIdx++;
      continue;
    }
    if (creditor.amount === 0) {
      cIdx++;
      continue;
    }

    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountMinor: settleAmount,
        currency,
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
    }

    if (debtor.amount === 0) {
      dIdx++;
    }
    if (creditor.amount === 0) {
      cIdx++;
    }
  }

  return transactions;
}

/**
 * Builds net positions for all users from raw list of expenses and confirmed settlements.
 */
export function calculateNetPositionsFromLedger(
  userIds: string[],
  expenses: {
    payerId: string;
    participants: { userId: string; allocatedAmountMinor: number }[];
  }[],
  confirmedSettlements: {
    payerId: string;
    receiverId: string;
    amountMinor: number;
  }[]
): UserNetPosition[] {
  const balanceMap = new Map<string, number>();

  for (const id of userIds) {
    balanceMap.set(id, 0);
  }

  // 1. Process Expenses:
  // Payer gets credit for total amount
  // Each participant gets debited for their share
  for (const exp of expenses) {
    const totalExp = exp.participants.reduce((sum, p) => sum + p.allocatedAmountMinor, 0);
    balanceMap.set(exp.payerId, (balanceMap.get(exp.payerId) || 0) + totalExp);

    for (const part of exp.participants) {
      balanceMap.set(
        part.userId,
        (balanceMap.get(part.userId) || 0) - part.allocatedAmountMinor
      );
    }
  }

  // 2. Process Confirmed Settlements:
  // Payer paid money, so payer gets credited (reduces debt)
  // Receiver received money, so receiver gets debited (reduces credit)
  for (const set of confirmedSettlements) {
    balanceMap.set(
      set.payerId,
      (balanceMap.get(set.payerId) || 0) + set.amountMinor
    );
    balanceMap.set(
      set.receiverId,
      (balanceMap.get(set.receiverId) || 0) - set.amountMinor
    );
  }

  return Array.from(balanceMap.entries()).map(([userId, netAmountMinor]) => ({
    userId,
    netAmountMinor,
  }));
}
