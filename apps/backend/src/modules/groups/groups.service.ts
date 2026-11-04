import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import { CreateGroupInput, UpdateGroupInput } from '@matrixsplit/shared';
import { EventsGateway } from '../../gateway/events.gateway';
import { randomBytes } from 'crypto';

@Injectable()
export class GroupsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private eventsGateway: EventsGateway
  ) {}

  async createGroup(userId: string, dto: CreateGroupInput) {
    const inviteCode = randomBytes(6).toString('hex').toUpperCase();

    const [group] = await this.db.transaction(async (tx: any) => {
      const [newGroup] = await tx
        .insert(schema.groups)
        .values({
          name: dto.name,
          description: dto.description,
          category: dto.category || 'friends',
          defaultCurrency: dto.defaultCurrency || 'INR',
          imageUrl: dto.imageUrl,
          createdById: userId,
          inviteCode,
        })
        .returning();

      // Creator is admin
      await tx.insert(schema.groupMembers).values({
        groupId: newGroup.id,
        userId,
        role: 'admin',
      });

      // Add extra initial members if provided
      if (dto.memberUserIds && dto.memberUserIds.length > 0) {
        for (const memberId of dto.memberUserIds) {
          if (memberId !== userId) {
            await tx.insert(schema.groupMembers).values({
              groupId: newGroup.id,
              userId: memberId,
              role: 'member',
            });
          }
        }
      }

      // Record activity
      await tx.insert(schema.activities).values({
        type: 'group_created',
        actorId: userId,
        groupId: newGroup.id,
        description: `created group "${newGroup.name}"`,
      });

      return [newGroup];
    });

    this.eventsGateway.emitToGroup(group.id, 'group_created', group);
    return group;
  }

  async getUserGroups(userId: string) {
    const memberships = await this.db
      .select({
        group: schema.groups,
        role: schema.groupMembers.role,
        joinedAt: schema.groupMembers.joinedAt,
      })
      .from(schema.groupMembers)
      .innerJoin(schema.groups, eq(schema.groupMembers.groupId, schema.groups.id))
      .where(eq(schema.groupMembers.userId, userId));

    const enrichedGroups = [];

    for (const item of memberships) {
      const members = await this.getGroupMembers(item.group.id);
      enrichedGroups.push({
        ...item.group,
        role: item.role,
        membersCount: members.length,
        members,
      });
    }

    return enrichedGroups;
  }

  async getGroupById(groupId: string, userId: string) {
    await this.ensureMembership(groupId, userId);

    const [group] = await this.db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.id, groupId));

    if (!group) throw new NotFoundException('Group not found');

    const members = await this.getGroupMembers(groupId);

    return {
      ...group,
      membersCount: members.length,
      members,
    };
  }

  async updateGroup(groupId: string, userId: string, dto: UpdateGroupInput) {
    await this.ensureAdmin(groupId, userId);

    const [updated] = await this.db
      .update(schema.groups)
      .set({
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.defaultCurrency ? { defaultCurrency: dto.defaultCurrency } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.groups.id, groupId))
      .returning();

    this.eventsGateway.emitToGroup(groupId, 'group_updated', updated);
    return updated;
  }

  async deleteGroup(groupId: string, userId: string) {
    await this.ensureAdmin(groupId, userId);

    await this.db.delete(schema.groups).where(eq(schema.groups.id, groupId));
    return { success: true, message: 'Group deleted successfully' };
  }

  async addMember(groupId: string, currentUserId: string, newUserId: string) {
    await this.ensureMembership(groupId, currentUserId);

    const existing = await this.db
      .select()
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, newUserId)
        )
      );

    if (existing.length > 0) {
      throw new BadRequestException('User is already a member of this group');
    }

    const [member] = await this.db
      .insert(schema.groupMembers)
      .values({
        groupId,
        userId: newUserId,
        role: 'member',
      })
      .returning();

    const [user] = await this.db
      .select({ fullName: schema.users.fullName })
      .from(schema.users)
      .where(eq(schema.users.id, newUserId));

    await this.db.insert(schema.activities).values({
      type: 'member_joined',
      actorId: newUserId,
      groupId,
      description: `${user?.fullName || 'A new member'} joined the group`,
    });

    this.eventsGateway.emitToGroup(groupId, 'member_joined', {
      groupId,
      userId: newUserId,
      userName: user?.fullName,
    });

    return member;
  }

  async joinGroupByInviteCode(inviteCode: string, userId: string) {
    const [group] = await this.db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.inviteCode, inviteCode.trim().toUpperCase()));

    if (!group) {
      throw new NotFoundException('Invalid invite link or code');
    }

    const existing = await this.db
      .select()
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, group.id),
          eq(schema.groupMembers.userId, userId)
        )
      );

    if (existing.length > 0) {
      return { group, message: 'You are already a member of this group' };
    }

    await this.addMember(group.id, group.createdById, userId);
    return { group, message: 'Successfully joined group' };
  }

  async removeMember(groupId: string, adminUserId: string, memberUserId: string) {
    await this.ensureAdmin(groupId, adminUserId);

    await this.db
      .delete(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, memberUserId)
        )
      );

    this.eventsGateway.emitToGroup(groupId, 'member_removed', {
      groupId,
      userId: memberUserId,
    });

    return { message: 'Member removed from group' };
  }

  async getGroupMembers(groupId: string) {
    const members = await this.db
      .select({
        id: schema.groupMembers.id,
        groupId: schema.groupMembers.groupId,
        userId: schema.groupMembers.userId,
        role: schema.groupMembers.role,
        joinedAt: schema.groupMembers.joinedAt,
        user: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.groupMembers)
      .innerJoin(schema.users, eq(schema.groupMembers.userId, schema.users.id))
      .where(eq(schema.groupMembers.groupId, groupId));

    return members;
  }

  async ensureMembership(groupId: string, userId: string) {
    const [member] = await this.db
      .select()
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, userId)
        )
      );

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return member;
  }

  async ensureAdmin(groupId: string, userId: string) {
    const member = await this.ensureMembership(groupId, userId);
    if (member.role !== 'admin') {
      throw new ForbiddenException('Admin permissions required for this action');
    }
    return member;
  }
}
