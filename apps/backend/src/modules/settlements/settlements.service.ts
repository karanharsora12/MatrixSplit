import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { CreateSettlementInput, ConfirmSettlementInput } from '@matrixsplit/shared';
import { EventsGateway } from '../../gateway/events.gateway';

@Injectable()
export class SettlementsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private eventsGateway: EventsGateway
  ) {}

  async createSettlement(currentUserId: string, dto: CreateSettlementInput) {
    if (dto.payerId !== currentUserId && dto.receiverId !== currentUserId) {
      throw new ForbiddenException('You must be either payer or receiver of the settlement');
    }

    if (dto.payerId === dto.receiverId) {
      throw new BadRequestException('Payer and receiver cannot be the same person');
    }

    // If payer records it, status starts as 'pending' awaiting receiver confirmation;
    // If receiver records it (marking they received money), it is immediately 'confirmed'.
    const initialStatus = currentUserId === dto.receiverId ? 'confirmed' : 'pending';
    const confirmedAt = initialStatus === 'confirmed' ? new Date() : null;

    const [settlement] = await this.db.transaction(async (tx: any) => {
      const [newRecord] = await tx
        .insert(schema.settlements)
        .values({
          payerId: dto.payerId,
          receiverId: dto.receiverId,
          groupId: dto.groupId || null,
          amountMinor: dto.amountMinor,
          currency: dto.currency || 'INR',
          paymentMethod: dto.paymentMethod || 'cash',
          notes: dto.notes,
          status: initialStatus,
          confirmedAt,
        })
        .returning();

      // Record activity
      await tx.insert(schema.activities).values({
        type: 'settlement_created',
        actorId: currentUserId,
        groupId: dto.groupId || null,
        description: `recorded a payment settlement of ${dto.amountMinor}`,
        metadata: {
          settlementId: newRecord.id,
          amountMinor: dto.amountMinor,
          currency: dto.currency,
          status: initialStatus,
        },
      });

      return [newRecord];
    });

    // Notify other party
    const targetUserId = currentUserId === dto.payerId ? dto.receiverId : dto.payerId;
    this.eventsGateway.emitToUser(targetUserId, 'settlement_updated', settlement);

    if (dto.groupId) {
      this.eventsGateway.emitToGroup(dto.groupId, 'settlement_updated', settlement);
    }

    return this.getSettlementById(settlement.id);
  }

  async confirmSettlement(
    settlementId: string,
    currentUserId: string,
    dto: ConfirmSettlementInput
  ) {
    const settlement = await this.getSettlementById(settlementId);

    // Only receiver can confirm or reject
    if (settlement.receiverId !== currentUserId) {
      throw new ForbiddenException('Only the receiving party can confirm or reject a settlement payment');
    }

    const [updated] = await this.db
      .update(schema.settlements)
      .set({
        status: dto.status,
        confirmedAt: dto.status === 'confirmed' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.settlements.id, settlementId))
      .returning();

    // Add activity
    await this.db.insert(schema.activities).values({
      type: dto.status === 'confirmed' ? 'settlement_confirmed' : 'settlement_rejected',
      actorId: currentUserId,
      groupId: settlement.groupId,
      description: `${dto.status} settlement payment`,
    });

    this.eventsGateway.emitToUser(settlement.payerId, 'settlement_updated', updated);

    return this.getSettlementById(settlementId);
  }

  async getSettlementById(settlementId: string) {
    const [record] = await this.db
      .select({
        id: schema.settlements.id,
        payerId: schema.settlements.payerId,
        receiverId: schema.settlements.receiverId,
        groupId: schema.settlements.groupId,
        amountMinor: schema.settlements.amountMinor,
        currency: schema.settlements.currency,
        paymentMethod: schema.settlements.paymentMethod,
        notes: schema.settlements.notes,
        status: schema.settlements.status,
        confirmedAt: schema.settlements.confirmedAt,
        createdAt: schema.settlements.createdAt,
        payer: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.settlements)
      .innerJoin(schema.users, eq(schema.settlements.payerId, schema.users.id))
      .where(eq(schema.settlements.id, settlementId));

    if (!record) throw new NotFoundException('Settlement record not found');

    const [receiver] = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        profileImage: schema.users.profileImage,
      })
      .from(schema.users)
      .where(eq(schema.users.id, record.receiverId));

    return {
      ...record,
      receiver,
    };
  }

  async getRecentSettlements(userId: string, limit = 10) {
    const records = await this.db
      .select({
        id: schema.settlements.id,
        payerId: schema.settlements.payerId,
        receiverId: schema.settlements.receiverId,
        groupId: schema.settlements.groupId,
        amountMinor: schema.settlements.amountMinor,
        currency: schema.settlements.currency,
        paymentMethod: schema.settlements.paymentMethod,
        notes: schema.settlements.notes,
        status: schema.settlements.status,
        confirmedAt: schema.settlements.confirmedAt,
        createdAt: schema.settlements.createdAt,
      })
      .from(schema.settlements)
      .where(
        or(
          eq(schema.settlements.payerId, userId),
          eq(schema.settlements.receiverId, userId)
        )
      )
      .orderBy(desc(schema.settlements.createdAt))
      .limit(limit);

    // Enrich with user names
    const enriched = [];
    for (const r of records) {
      const [payer] = await this.db
        .select({ id: schema.users.id, fullName: schema.users.fullName })
        .from(schema.users)
        .where(eq(schema.users.id, r.payerId));

      const [receiver] = await this.db
        .select({ id: schema.users.id, fullName: schema.users.fullName })
        .from(schema.users)
        .where(eq(schema.users.id, r.receiverId));

      enriched.push({
        ...r,
        payer,
        receiver,
      });
    }

    return enriched;
  }
}
