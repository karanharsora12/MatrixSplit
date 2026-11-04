import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { fromMinorUnits, ExpenseCategory } from '@matrixsplit/shared';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async getSpendingAnalytics(userId: string) {
    // 1. Fetch all expense participant records for this user (user's real share)
    const userShares = await this.db
      .select({
        allocatedAmountMinor: schema.expenseParticipants.allocatedAmountMinor,
        expenseId: schema.expenses.id,
        title: schema.expenses.title,
        category: schema.expenses.category,
        date: schema.expenses.date,
        currency: schema.expenses.currency,
        groupId: schema.expenses.groupId,
        totalExpenseMinor: schema.expenses.totalAmountMinor,
      })
      .from(schema.expenseParticipants)
      .innerJoin(schema.expenses, eq(schema.expenseParticipants.expenseId, schema.expenses.id))
      .where(
        and(
          eq(schema.expenseParticipants.userId, userId),
          eq(schema.expenses.isDeleted, false)
        )
      );

    const totalSpentMinor = userShares.reduce(
      (sum: number, s: any) => sum + s.allocatedAmountMinor,
      0
    );

    // Category breakdown
    const categoryMap = new Map<string, number>();
    for (const share of userShares) {
      const cat = share.category || 'general';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + share.allocatedAmountMinor);
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, amountMinor]) => ({
      category: cat as ExpenseCategory,
      categoryLabel: cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      totalAmountMinor: amountMinor,
      percentage: totalSpentMinor > 0 ? Math.round((amountMinor / totalSpentMinor) * 100) : 0,
    })).sort((a, b) => b.totalAmountMinor - a.totalAmountMinor);

    // Group breakdown
    const groupMap = new Map<string, number>();
    for (const share of userShares) {
      const gId = share.groupId || 'non-group';
      groupMap.set(gId, (groupMap.get(gId) || 0) + share.allocatedAmountMinor);
    }

    const groupBreakdown = [];
    for (const [gId, amountMinor] of groupMap.entries()) {
      let groupName = 'Individual / Friends';
      if (gId !== 'non-group') {
        const [g] = await this.db
          .select({ name: schema.groups.name })
          .from(schema.groups)
          .where(eq(schema.groups.id, gId));
        if (g) groupName = g.name;
      }
      groupBreakdown.push({
        groupId: gId,
        groupName,
        totalAmountMinor: amountMinor,
      });
    }

    // Monthly trends (group by YYYY-MM)
    const monthMap = new Map<string, number>();
    for (const share of userShares) {
      const d = new Date(share.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + share.allocatedAmountMinor);
    }

    const monthlyTrends = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, amountMinor]) => {
        const [year, month] = monthKey.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
          month: monthKey,
          label,
          amountMinor,
        };
      });

    return {
      period: 'all',
      currency: 'INR',
      totalSpentMinor,
      totalExpensesCount: userShares.length,
      categoryBreakdown,
      groupBreakdown,
      monthlyTrends,
    };
  }

  async exportExpensesCsv(userId: string): Promise<string> {
    const userShares = await this.db
      .select({
        title: schema.expenses.title,
        totalAmountMinor: schema.expenses.totalAmountMinor,
        allocatedAmountMinor: schema.expenseParticipants.allocatedAmountMinor,
        category: schema.expenses.category,
        date: schema.expenses.date,
        currency: schema.expenses.currency,
      })
      .from(schema.expenseParticipants)
      .innerJoin(schema.expenses, eq(schema.expenseParticipants.expenseId, schema.expenses.id))
      .where(
        and(
          eq(schema.expenseParticipants.userId, userId),
          eq(schema.expenses.isDeleted, false)
        )
      );

    const headers = 'Date,Title,Category,Total Expense,Your Share,Currency\n';
    const rows = userShares.map((s: any) => {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      const total = fromMinorUnits(s.totalAmountMinor, s.currency);
      const share = fromMinorUnits(s.allocatedAmountMinor, s.currency);
      return `"${dateStr}","${s.title.replace(/"/g, '""')}","${s.category}",${total},${share},"${s.currency}"`;
    }).join('\n');

    return headers + rows;
  }
}
