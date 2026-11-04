import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import {
  SignupInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  SetupProfileInput,
} from '@matrixsplit/shared';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private jwtService: JwtService
  ) {}

  async signup(dto: SignupInput) {
    const existing = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email.toLowerCase()));

    if (existing.length > 0) {
      throw new BadRequestException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const [newUser] = await this.db
      .insert(schema.users)
      .values({
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        defaultCurrency: dto.defaultCurrency || 'INR',
        isEmailVerified: true, // auto-verified for onboarding ease
      })
      .returning();

    const tokens = await this.generateTokens(newUser.id, newUser.email);
    await this.createSession(newUser.id, tokens.refreshToken);

    const { passwordHash: _, ...userWithoutPass } = newUser;
    return {
      user: userWithoutPass,
      ...tokens,
    };
  }

  async login(dto: LoginInput) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email.toLowerCase()));

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.createSession(user.id, tokens.refreshToken);

    const { passwordHash: _, ...userWithoutPass } = user;
    return {
      user: userWithoutPass,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'matrixsplit-refresh-secret-2026',
      });

      const [user] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, payload.userId));

      if (!user) {
        throw new UnauthorizedException('Invalid session');
      }

      // Rotate tokens
      const newTokens = await this.generateTokens(user.id, user.email);
      await this.createSession(user.id, newTokens.refreshToken);

      return newTokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordInput) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email.toLowerCase()));

    if (!user) {
      // Don't leak user existence
      return { message: 'If an account exists, a 6-digit OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.db
      .update(schema.users)
      .set({
        resetPasswordOtp: otp,
        resetPasswordExpiresAt: expiresAt,
      })
      .where(eq(schema.users.id, user.id));

    return {
      message: 'OTP sent successfully',
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordInput) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email.toLowerCase()));

    if (!user || user.resetPasswordOtp !== dto.otp) {
      throw new BadRequestException('Invalid OTP or email');
    }

    if (!user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt) < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.db
      .update(schema.users)
      .set({
        passwordHash,
        resetPasswordOtp: null,
        resetPasswordExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    return { message: 'Password has been reset successfully' };
  }

  async setupProfile(userId: string, dto: SetupProfileInput) {
    const [updated] = await this.db
      .update(schema.users)
      .set({
        ...(dto.fullName ? { fullName: dto.fullName } : {}),
        ...(dto.profileImage !== undefined ? { profileImage: dto.profileImage } : {}),
        ...(dto.defaultCurrency ? { defaultCurrency: dto.defaultCurrency } : {}),
        ...(dto.preferredLanguage ? { preferredLanguage: dto.preferredLanguage } : {}),
        ...(dto.themePreference ? { themePreference: dto.themePreference } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning();

    if (!updated) throw new NotFoundException('User not found');

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async getMe(userId: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      { userId, email },
      {
        secret: process.env.JWT_SECRET || 'matrixsplit-jwt-secret-key-2026',
        expiresIn: '1d',
      }
    );

    const refreshToken = await this.jwtService.signAsync(
      { userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'matrixsplit-refresh-secret-2026',
        expiresIn: '30d',
      }
    );

    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, refreshToken: string) {
    const salt = await bcrypt.genSalt(6);
    const hash = await bcrypt.hash(refreshToken, salt);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.db.insert(schema.userSessions).values({
      userId,
      refreshTokenHash: hash,
      expiresAt,
    });
  }
}
