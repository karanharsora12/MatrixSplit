import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import {
  simplifyDebts,
  calculateNetPositionsFromLedger,
  DebtRelation,
  UserBalanceOverview,
} from '@matrixsplit/shared';

@Injectable()
export class BalancesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  /**
   * Calculates overall user balance across all groups & non-group friends strictly from the ledger
   */
  async getUserBalanceOverview(userId: string): Promise<UserBalanceOverview> {
    // 1. Fetch user's active groups
    const memberships = await this.db
      .select({ groupId: schema.groupMembers.groupId })
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.userId, userId));

    const activeGroupsCount = memberships.length;

    // 2. Fetch all expenses where user is payer or participant
    const userExpenses = await this.db
      .select({
        id: schema.expenses.id,
        payerId: schema.expenses.payerId,
        currency: schema.expenses.currency,
      })
      .from(schema.expenses)
      .where(eq(schema.expenses.isDeleted, false));

    const expenseIds = userExpenses.map((e: any) => e.id);

    // Fetch participant rows for all active expenses
    const participants = expenseIds.length > 0
      ? await this.db
          .select({
            expenseId: schema.expenseParticipants.expenseId,
            userId: schema.expenseParticipants.userId,
            allocatedAmountMinor: schema.expenseParticipants.allocatedAmountMinor,
          })
          .from(schema.expenseParticipants)
          .where(inArray(schema.expenseParticipants.expenseId, expenseIds))
      : [];

    // Group participants by expenseId
    const participantsByExpense = new Map<string, any[]>();
    for (const p of participants) {
      if (!participantsByExpense.has(p.expenseId)) {
        participantsByExpense.set(p.expenseId, []);
      }
      participantsByExpense.get(p.expenseId)!.push(p);
    }

    const expenseLedger = userExpenses.map((exp: any) => ({
      payerId: exp.payerId,
      participants: participantsByExpense.get(exp.id) || [],
    }));

    // 3. Fetch all confirmed settlements
    const confirmedSettlements = await this.db
      .select({
        payerId: schema.settlements.payerId,
        receiverId: schema.settlements.receiverId,
        amountMinor: schema.settlements.amountMinor,
      })
      .from(schema.settlements)
      .where(eq(schema.settlements.status, 'confirmed'));

    // 4. Collect all distinct user IDs involved
    const allUserIdsSet = new Set<string>();
    allUserIdsSet.add(userId);
    for (const exp of expenseLedger) {
      allUserIdsSet.add(exp.payerId);
      for (const p of exp.participants) {
        allUserIdsSet.add(p.userId);
      }
    }
    for (const s of confirmedSettlements) {
      allUserIdsSet.add(s.payerId);
      allUserIdsSet.add(s.receiverId);
    }

    const allUserIds = Array.from(allUserIdsSet);
    const netPositions = calculateNetPositionsFromLedger(
      allUserIds,
      expenseLedger,
      confirmedSettlements
    );

    // Simplify the entire debt network
    const simplifiedDebts = simplifyDebts(netPositions, 'INR');

    // Debts where currentUser is debtor (you owe)
    const youOweRaw = simplifiedDebts.filter((d) => d.fromUserId === userId);
    // Debts where currentUser is creditor (owed to you)
    const owedToYouRaw = simplifiedDebts.filter((d) => d.toUserId === userId);

    // Enrich with user profile info
    const youOweList: DebtRelation[] = [];
    for (const d of youOweRaw) {
      const [toUser] = await this.db
        .select({
          id: schema.users.id,
          fullName: schema.users.fullName,
          profileImage: schema.users.profileImage,
        })
        .from(schema.users)
        .where(eq(schema.users.id, d.toUserId));

      youOweList.push({
        ...d,
        toUser: toUser || { id: d.toUserId, fullName: 'Unknown User' },
      });
    }

    const owedToYouList: DebtRelation[] = [];
    for (const d of owedToYouRaw) {
      const [fromUser] = await this.db
        .select({
          id: schema.users.id,
          fullName: schema.users.fullName,
          profileImage: schema.users.profileImage,
        })
        .from(schema.users)
        .where(eq(schema.users.id, d.fromUserId));

      owedToYouList.push({
        ...d,
        fromUser: fromUser || { id: d.fromUserId, fullName: 'Unknown User' },
      });
    }

    const totalYouOweMinor = youOweList.reduce((acc, d) => acc + d.amountMinor, 0);
    const totalOwedToYouMinor = owedToYouList.reduce((acc, d) => acc + d.amountMinor, 0);
    const totalBalanceMinor = totalOwedToYouMinor - totalYouOweMinor;

    return {
      totalBalanceMinor,
      totalYouOweMinor,
      totalOwedToYouMinor,
      activeGroupsCount,
      currency: 'INR',
      youOweList,
      owedToYouList,
    };
  }

  /**
   * Calculates group balances and applies debt simplification
   */
  async getGroupBalances(groupId: string, currentUserId: string) {
    // 1. Fetch group members
    const members = await this.db
      .select({
        id: schema.groupMembers.id,
        userId: schema.groupMembers.userId,
        user: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.groupMembers)
      .innerJoin(schema.users, eq(schema.groupMembers.userId, schema.users.id))
      .where(eq(schema.groupMembers.groupId, groupId));

    const memberIds = members.map((m: any) => m.userId);

    // 2. Fetch group expenses
    const groupExpenses = await this.db
      .select({
        id: schema.expenses.id,
        payerId: schema.expenses.payerId,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.groupId, groupId),
          eq(schema.expenses.isDeleted, false)
        )
      );

    const expenseIds = groupExpenses.map((e: any) => e.id);
    const participants = expenseIds.length > 0
      ? await this.db
          .select({
            expenseId: schema.expenseParticipants.expenseId,
            userId: schema.expenseParticipants.userId,
            allocatedAmountMinor: schema.expenseParticipants.allocatedAmountMinor,
          })
          .from(schema.expenseParticipants)
          .where(inArray(schema.expenseParticipants.expenseId, expenseIds))
      : [];

    const participantsByExpense = new Map<string, any[]>();
    for (const p of participants) {
      if (!participantsByExpense.has(p.expenseId)) {
        participantsByExpense.set(p.expenseId, []);
      }
      participantsByExpense.get(p.expenseId)!.push(p);
    }

    const expenseLedger = groupExpenses.map((exp: any) => ({
      payerId: exp.payerId,
      participants: participantsByExpense.get(exp.id) || [],
    }));

    // 3. Fetch confirmed group settlements
    const settlements = await this.db
      .select({
        payerId: schema.settlements.payerId,
        receiverId: schema.settlements.receiverId,
        amountMinor: schema.settlements.amountMinor,
      })
      .from(schema.settlements)
      .where(
        and(
          eq(schema.settlements.groupId, groupId),
          eq(schema.settlements.status, 'confirmed')
        )
      );

    // 4. Calculate individual member net positions
    const netPositions = calculateNetPositionsFromLedger(
      memberIds,
      expenseLedger,
      settlements
    );

    // 5. Run debt simplification
    const simplifiedTransactions = simplifyDebts(netPositions, 'INR');

    // Enrich simplified transactions with member names
    const enrichedTransactions = simplifiedTransactions.map((t) => {
      const fromMember = members.find((m: any) => m.userId === t.fromUserId);
      const toMember = members.find((m: any) => m.userId === t.toUserId);

      return {
        ...t,
        fromUser: fromMember?.user || { id: t.fromUserId, fullName: 'Unknown' },
        toUser: toMember?.user || { id: t.toUserId, fullName: 'Unknown' },
      };
    });

    // Individual member balance summary
    const memberBalances = members.map((m: any) => {
      const pos = netPositions.find((p) => p.userId === m.userId);
      return {
        userId: m.userId,
        fullName: m.user.fullName,
        profileImage: m.user.profileImage,
        netBalanceMinor: pos?.netAmountMinor || 0,
      };
    });

    const userPosition = netPositions.find((p) => p.userId === currentUserId);

    return {
      groupId,
      userNetBalanceMinor: userPosition?.netAmountMinor || 0,
      memberBalances,
      simplifiedDebts: enrichedTransactions,
    };
  }
}
