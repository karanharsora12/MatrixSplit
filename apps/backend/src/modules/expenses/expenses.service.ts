import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  resolveSplit,
} from '@matrixsplit/shared';
import { EventsGateway } from '../../gateway/events.gateway';

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private eventsGateway: EventsGateway
  ) {}

  async createExpense(userId: string, dto: CreateExpenseInput) {
    // 1. Resolve participant shares using exact minor unit arithmetic
    const calculatedShares = resolveSplit(
      dto.splitType,
      dto.totalAmountMinor,
      dto.participants
    );

    // Verify sum strictly equals total
    const sum = calculatedShares.reduce((s, p) => s + p.allocatedAmountMinor, 0);
    if (sum !== dto.totalAmountMinor) {
      throw new BadRequestException(
        `Split shares sum to ${sum} minor units, but total is ${dto.totalAmountMinor}`
      );
    }

    // 2. Perform atomic database transaction
    const [expense] = await this.db.transaction(async (tx: any) => {
      const [newExpense] = await tx
        .insert(schema.expenses)
        .values({
          title: dto.title,
          totalAmountMinor: dto.totalAmountMinor,
          currency: dto.currency || 'INR',
          category: dto.category || 'general',
          date: new Date(dto.date),
          payerId: dto.payerId,
          groupId: dto.groupId || null,
          splitType: dto.splitType,
          notes: dto.notes,
          receiptUrl: dto.receiptUrl,
          createdById: userId,
        })
        .returning();

      // Insert participant shares
      for (const share of calculatedShares) {
        const rawInput = dto.participants.find((p) => p.userId === share.userId);
        await tx.insert(schema.expenseParticipants).values({
          expenseId: newExpense.id,
          userId: share.userId,
          allocatedAmountMinor: share.allocatedAmountMinor,
          splitType: dto.splitType,
          splitValue:
            dto.splitType === 'percentage'
              ? rawInput?.percentage?.toString()
              : dto.splitType === 'shares'
              ? rawInput?.shares?.toString()
              : null,
        });
      }

      // Record activity
      await tx.insert(schema.activities).values({
        type: 'expense_created',
        actorId: userId,
        groupId: dto.groupId || null,
        description: `added expense "${dto.title}"`,
        metadata: {
          expenseId: newExpense.id,
          amountMinor: dto.totalAmountMinor,
          currency: dto.currency,
        },
      });

      return [newExpense];
    });

    // 3. Emit real-time notification
    if (dto.groupId) {
      this.eventsGateway.emitToGroup(dto.groupId, 'expense_created', {
        expenseId: expense.id,
        groupId: dto.groupId,
      });
    }

    for (const p of calculatedShares) {
      if (p.userId !== userId) {
        this.eventsGateway.emitToUser(p.userId, 'expense_added', {
          expenseId: expense.id,
          title: expense.title,
          yourShareMinor: p.allocatedAmountMinor,
        });
      }
    }

    return this.getExpenseById(expense.id, userId);
  }

  async getExpenseById(expenseId: string, currentUserId: string) {
    const [expense] = await this.db
      .select({
        id: schema.expenses.id,
        title: schema.expenses.title,
        totalAmountMinor: schema.expenses.totalAmountMinor,
        currency: schema.expenses.currency,
        category: schema.expenses.category,
        date: schema.expenses.date,
        payerId: schema.expenses.payerId,
        groupId: schema.expenses.groupId,
        splitType: schema.expenses.splitType,
        notes: schema.expenses.notes,
        receiptUrl: schema.expenses.receiptUrl,
        createdById: schema.expenses.createdById,
        createdAt: schema.expenses.createdAt,
        updatedAt: schema.expenses.updatedAt,
        payer: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.expenses)
      .innerJoin(schema.users, eq(schema.expenses.payerId, schema.users.id))
      .where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.isDeleted, false)));

    if (!expense) throw new NotFoundException('Expense not found');

    // Fetch participants with user info
    const participants = await this.db
      .select({
        id: schema.expenseParticipants.id,
        expenseId: schema.expenseParticipants.expenseId,
        userId: schema.expenseParticipants.userId,
        allocatedAmountMinor: schema.expenseParticipants.allocatedAmountMinor,
        splitType: schema.expenseParticipants.splitType,
        splitValue: schema.expenseParticipants.splitValue,
        user: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.expenseParticipants)
      .innerJoin(schema.users, eq(schema.expenseParticipants.userId, schema.users.id))
      .where(eq(schema.expenseParticipants.expenseId, expenseId));

    return {
      ...expense,
      participants,
    };
  }

  async updateExpense(expenseId: string, userId: string, dto: UpdateExpenseInput) {
    const existing = await this.getExpenseById(expenseId, userId);

    const newAmount = dto.totalAmountMinor ?? existing.totalAmountMinor;
    const newSplitType = (dto.splitType ?? existing.splitType) as any;
    const participantsInput = dto.participants ?? existing.participants;

    const calculatedShares = resolveSplit(
      newSplitType,
      newAmount,
      participantsInput
    );

    await this.db.transaction(async (tx: any) => {
      await tx
        .update(schema.expenses)
        .set({
          ...(dto.title ? { title: dto.title } : {}),
          ...(dto.totalAmountMinor ? { totalAmountMinor: dto.totalAmountMinor } : {}),
          ...(dto.currency ? { currency: dto.currency } : {}),
          ...(dto.category ? { category: dto.category } : {}),
          ...(dto.date ? { date: new Date(dto.date) } : {}),
          ...(dto.payerId ? { payerId: dto.payerId } : {}),
          ...(dto.groupId !== undefined ? { groupId: dto.groupId } : {}),
          ...(dto.splitType ? { splitType: dto.splitType } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(dto.receiptUrl !== undefined ? { receiptUrl: dto.receiptUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.expenses.id, expenseId));

      // Replace participants
      await tx
        .delete(schema.expenseParticipants)
        .where(eq(schema.expenseParticipants.expenseId, expenseId));

      for (const share of calculatedShares) {
        const raw = participantsInput.find((p: any) => p.userId === share.userId);
        await tx.insert(schema.expenseParticipants).values({
          expenseId,
          userId: share.userId,
          allocatedAmountMinor: share.allocatedAmountMinor,
          splitType: newSplitType,
          splitValue:
            newSplitType === 'percentage'
              ? raw?.percentage?.toString()
              : newSplitType === 'shares'
              ? raw?.shares?.toString()
              : null,
        });
      }

      await tx.insert(schema.activities).values({
        type: 'expense_updated',
        actorId: userId,
        groupId: existing.groupId,
        description: `updated expense "${existing.title}"`,
      });
    });

    if (existing.groupId) {
      this.eventsGateway.emitToGroup(existing.groupId, 'expense_updated', {
        expenseId,
        groupId: existing.groupId,
      });
    }

    return this.getExpenseById(expenseId, userId);
  }

  async deleteExpense(expenseId: string, userId: string) {
    const existing = await this.getExpenseById(expenseId, userId);

    // Soft delete to protect financial audit history as required by Section 15
    await this.db
      .update(schema.expenses)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(schema.expenses.id, expenseId));

    await this.db.insert(schema.activities).values({
      type: 'expense_deleted',
      actorId: userId,
      groupId: existing.groupId,
      description: `deleted expense "${existing.title}"`,
    });

    if (existing.groupId) {
      this.eventsGateway.emitToGroup(existing.groupId, 'expense_deleted', {
        expenseId,
      });
    }

    return { success: true, message: 'Expense deleted successfully' };
  }

  async getGroupExpenses(groupId: string, userId: string) {
    const expenseRecords = await this.db
      .select({
        id: schema.expenses.id,
        title: schema.expenses.title,
        totalAmountMinor: schema.expenses.totalAmountMinor,
        currency: schema.expenses.currency,
        category: schema.expenses.category,
        date: schema.expenses.date,
        payerId: schema.expenses.payerId,
        groupId: schema.expenses.groupId,
        splitType: schema.expenses.splitType,
        notes: schema.expenses.notes,
        receiptUrl: schema.expenses.receiptUrl,
        createdAt: schema.expenses.createdAt,
        payer: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.expenses)
      .innerJoin(schema.users, eq(schema.expenses.payerId, schema.users.id))
      .where(
        and(
          eq(schema.expenses.groupId, groupId),
          eq(schema.expenses.isDeleted, false)
        )
      )
      .orderBy(desc(schema.expenses.date));

    // Enrich with current user's share
    const enriched = [];
    for (const exp of expenseRecords) {
      const [participant] = await this.db
        .select({
          allocatedAmountMinor: schema.expenseParticipants.allocatedAmountMinor,
        })
        .from(schema.expenseParticipants)
        .where(
          and(
            eq(schema.expenseParticipants.expenseId, exp.id),
            eq(schema.expenseParticipants.userId, userId)
          )
        );

      enriched.push({
        ...exp,
        userShareMinor: participant?.allocatedAmountMinor || 0,
      });
    }

    return enriched;
  }

  async getRecentExpenses(userId: string, limit = 10) {
    // Expenses where user is payer OR participant
    const userExpenses = await this.db
      .select({
        id: schema.expenses.id,
        title: schema.expenses.title,
        totalAmountMinor: schema.expenses.totalAmountMinor,
        currency: schema.expenses.currency,
        category: schema.expenses.category,
        date: schema.expenses.date,
        payerId: schema.expenses.payerId,
        groupId: schema.expenses.groupId,
        splitType: schema.expenses.splitType,
        payer: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.expenses)
      .innerJoin(schema.users, eq(schema.expenses.payerId, schema.users.id))
      .where(eq(schema.expenses.isDeleted, false))
      .orderBy(desc(schema.expenses.date))
      .limit(limit);

    return userExpenses;
  }
}
