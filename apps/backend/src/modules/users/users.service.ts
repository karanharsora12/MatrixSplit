import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, or, ilike, and, ne } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length === 0) return [];

    const searchPattern = `%${query.trim()}%`;
    const results = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        profileImage: schema.users.profileImage,
        defaultCurrency: schema.users.defaultCurrency,
      })
      .from(schema.users)
      .where(
        and(
          ne(schema.users.id, currentUserId),
          or(
            ilike(schema.users.fullName, searchPattern),
            ilike(schema.users.email, searchPattern)
          )
        )
      )
      .limit(15);

    return results;
  }

  async getUserById(userId: string) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        profileImage: schema.users.profileImage,
        defaultCurrency: schema.users.defaultCurrency,
        preferredLanguage: schema.users.preferredLanguage,
        themePreference: schema.users.themePreference,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteAccount(userId: string) {
    await this.db.delete(schema.users).where(eq(schema.users.id, userId));
    return { success: true, message: 'Account deleted successfully' };
  }
}
