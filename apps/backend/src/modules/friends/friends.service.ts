import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, or, and } from 'drizzle-orm';
import { EventsGateway } from '../../gateway/events.gateway';

@Injectable()
export class FriendsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private eventsGateway: EventsGateway
  ) {}

  async sendFriendRequest(senderId: string, emailOrUserId: string) {
    // Find receiver
    const [receiver] = await this.db
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.email, emailOrUserId.toLowerCase()),
          eq(schema.users.id, emailOrUserId)
        )
      );

    if (!receiver) {
      throw new NotFoundException('User with specified email or ID not found');
    }

    if (receiver.id === senderId) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }

    // Check if already friends
    const existingFriendship = await this.db
      .select()
      .from(schema.friendships)
      .where(
        or(
          and(eq(schema.friendships.user1Id, senderId), eq(schema.friendships.user2Id, receiver.id)),
          and(eq(schema.friendships.user1Id, receiver.id), eq(schema.friendships.user2Id, senderId))
        )
      );

    if (existingFriendship.length > 0) {
      throw new BadRequestException('You are already friends with this user');
    }

    // Check existing pending request
    const existingReq = await this.db
      .select()
      .from(schema.friendRequests)
      .where(
        or(
          and(eq(schema.friendRequests.senderId, senderId), eq(schema.friendRequests.receiverId, receiver.id)),
          and(eq(schema.friendRequests.senderId, receiver.id), eq(schema.friendRequests.receiverId, senderId))
        )
      );

    if (existingReq.length > 0 && existingReq[0].status === 'pending') {
      throw new BadRequestException('A friend request between you is already pending');
    }

    const [sender] = await this.db
      .select({ fullName: schema.users.fullName })
      .from(schema.users)
      .where(eq(schema.users.id, senderId));

    const [request] = await this.db
      .insert(schema.friendRequests)
      .values({
        senderId,
        receiverId: receiver.id,
        status: 'pending',
      })
      .returning();

    // Create notification
    await this.db.insert(schema.notifications).values({
      userId: receiver.id,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${sender?.fullName || 'Someone'} sent you a friend request.`,
      metadata: { requestId: request.id, senderId },
    });

    this.eventsGateway.emitToUser(receiver.id, 'friend_request_received', {
      requestId: request.id,
      senderId,
      senderName: sender?.fullName,
    });

    return request;
  }

  async respondToRequest(requestId: string, userId: string, action: 'accept' | 'reject') {
    const [req] = await this.db
      .select()
      .from(schema.friendRequests)
      .where(and(eq(schema.friendRequests.id, requestId), eq(schema.friendRequests.receiverId, userId)));

    if (!req) {
      throw new NotFoundException('Friend request not found or unauthorized');
    }

    if (action === 'accept') {
      await this.db.transaction(async (tx: any) => {
        await tx
          .update(schema.friendRequests)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(schema.friendRequests.id, requestId));

        // Create mutual friendship
        await tx.insert(schema.friendships).values({
          user1Id: req.senderId,
          user2Id: req.receiverId,
        });

        // Add activity
        await tx.insert(schema.activities).values({
          type: 'friend_request_accepted',
          actorId: userId,
          description: 'became friends',
          metadata: { friendId: req.senderId },
        });
      });

      this.eventsGateway.emitToUser(req.senderId, 'friend_request_accepted', {
        friendId: userId,
      });

      return { message: 'Friend request accepted' };
    } else {
      await this.db
        .update(schema.friendRequests)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(schema.friendRequests.id, requestId));

      return { message: 'Friend request rejected' };
    }
  }

  async getFriends(currentUserId: string) {
    // Fetch all friendship records
    const friendshipRecords = await this.db
      .select()
      .from(schema.friendships)
      .where(
        or(
          eq(schema.friendships.user1Id, currentUserId),
          eq(schema.friendships.user2Id, currentUserId)
        )
      );

    if (friendshipRecords.length === 0) return [];

    const friendUserIds = friendshipRecords.map((f: any) =>
      f.user1Id === currentUserId ? f.user2Id : f.user1Id
    );

    // Fetch friend profiles
    const friendProfiles = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        profileImage: schema.users.profileImage,
        defaultCurrency: schema.users.defaultCurrency,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(
        or(...friendUserIds.map((id: string) => eq(schema.users.id, id)))
      );

    // Calculate pairwise mutual balances between current user and each friend from non-group / direct expenses & settlements
    // (This guarantees real-time ledger consistency as required by Section 15)
    const result = [];
    for (const friend of friendProfiles) {
      const mutualBalanceMinor = await this.calculateMutualBalance(currentUserId, friend.id);
      result.push({
        ...friend,
        netBalanceMinor: mutualBalanceMinor,
      });
    }

    return result;
  }

  async getPendingRequests(currentUserId: string) {
    const received = await this.db
      .select({
        id: schema.friendRequests.id,
        senderId: schema.friendRequests.senderId,
        status: schema.friendRequests.status,
        createdAt: schema.friendRequests.createdAt,
        sender: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.friendRequests)
      .innerJoin(schema.users, eq(schema.friendRequests.senderId, schema.users.id))
      .where(
        and(
          eq(schema.friendRequests.receiverId, currentUserId),
          eq(schema.friendRequests.status, 'pending')
        )
      );

    return received;
  }

  async removeFriend(currentUserId: string, friendId: string) {
    await this.db
      .delete(schema.friendships)
      .where(
        or(
          and(eq(schema.friendships.user1Id, currentUserId), eq(schema.friendships.user2Id, friendId)),
          and(eq(schema.friendships.user1Id, friendId), eq(schema.friendships.user2Id, currentUserId))
        )
      );

    return { message: 'Friend removed successfully' };
  }

  async calculateMutualBalance(userA: string, userB: string): Promise<number> {
    // 1. Direct expenses where userA paid and userB participated
    const paidByA = await this.db
      .select({
        allocatedAmountMinor: schema.expenseParticipants.allocatedAmountMinor,
      })
      .from(schema.expenses)
      .innerJoin(
        schema.expenseParticipants,
        eq(schema.expenses.id, schema.expenseParticipants.expenseId)
      )
      .where(
        and(
          eq(schema.expenses.payerId, userA),
          eq(schema.expenseParticipants.userId, userB),
          eq(schema.expenses.isDeleted, false)
        )
      );

    // 2. Direct expenses where userB paid and userA participated
    const paidByB = await this.db
      .select({
        allocatedAmountMinor: schema.expenseParticipants.allocatedAmountMinor,
      })
      .from(schema.expenses)
      .innerJoin(
        schema.expenseParticipants,
        eq(schema.expenses.id, schema.expenseParticipants.expenseId)
      )
      .where(
        and(
          eq(schema.expenses.payerId, userB),
          eq(schema.expenseParticipants.userId, userA),
          eq(schema.expenses.isDeleted, false)
        )
      );

    // 3. Settlements where userB paid userA
    const settlementsBtoA = await this.db
      .select({ amountMinor: schema.settlements.amountMinor })
      .from(schema.settlements)
      .where(
        and(
          eq(schema.settlements.payerId, userB),
          eq(schema.settlements.receiverId, userA),
          eq(schema.settlements.status, 'confirmed')
        )
      );

    // 4. Settlements where userA paid userB
    const settlementsAtoB = await this.db
      .select({ amountMinor: schema.settlements.amountMinor })
      .from(schema.settlements)
      .where(
        and(
          eq(schema.settlements.payerId, userA),
          eq(schema.settlements.receiverId, userB),
          eq(schema.settlements.status, 'confirmed')
        )
      );

    const bOwesA = paidByA.reduce((sum: number, p: any) => sum + p.allocatedAmountMinor, 0);
    const aOwesB = paidByB.reduce((sum: number, p: any) => sum + p.allocatedAmountMinor, 0);
    const settledByB = settlementsBtoA.reduce((sum: number, s: any) => sum + s.amountMinor, 0);
    const settledByA = settlementsAtoB.reduce((sum: number, s: any) => sum + s.amountMinor, 0);

    // Net from perspective of userA:
    // positive = userB owes userA
    // negative = userA owes userB
    return (bOwesA - settledByB) - (aOwesB - settledByA);
  }
}
