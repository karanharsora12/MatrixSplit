import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, desc, or, inArray } from 'drizzle-orm';

@Injectable()
export class ActivitiesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async getUserFeed(userId: string, limit = 25) {
    // 1. Fetch user's group IDs
    const userGroups = await this.db
      .select({ groupId: schema.groupMembers.groupId })
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.userId, userId));

    const groupIds = userGroups.map((g: any) => g.groupId);

    // 2. Fetch activities where actor is user OR activity is in one of user's groups
    const query = groupIds.length > 0
      ? or(
          eq(schema.activities.actorId, userId),
          inArray(schema.activities.groupId, groupIds)
        )
      : eq(schema.activities.actorId, userId);

    const rows = await this.db
      .select({
        id: schema.activities.id,
        type: schema.activities.type,
        actorId: schema.activities.actorId,
        groupId: schema.activities.groupId,
        description: schema.activities.description,
        metadata: schema.activities.metadata,
        createdAt: schema.activities.createdAt,
        actor: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.activities)
      .innerJoin(schema.users, eq(schema.activities.actorId, schema.users.id))
      .where(query)
      .orderBy(desc(schema.activities.createdAt))
      .limit(limit);

    return rows;
  }

  async getGroupFeed(groupId: string, limit = 25) {
    const rows = await this.db
      .select({
        id: schema.activities.id,
        type: schema.activities.type,
        actorId: schema.activities.actorId,
        groupId: schema.activities.groupId,
        description: schema.activities.description,
        metadata: schema.activities.metadata,
        createdAt: schema.activities.createdAt,
        actor: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.activities)
      .innerJoin(schema.users, eq(schema.activities.actorId, schema.users.id))
      .where(eq(schema.activities.groupId, groupId))
      .orderBy(desc(schema.activities.createdAt))
      .limit(limit);

    return rows;
  }
}
