import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';
import {
  SignupSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SetupProfileSchema,
} from '@matrixsplit/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() body: any) {
    const validated = SignupSchema.parse(body);
    return this.authService.signup(validated);
  }

  @Public()
  @Post('login')
  async login(@Body() body: any) {
    const validated = LoginSchema.parse(body);
    return this.authService.login(validated);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    const validated = ForgotPasswordSchema.parse(body);
    return this.authService.forgotPassword(validated);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    const validated = ResetPasswordSchema.parse(body);
    return this.authService.resetPassword(validated);
  }

  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getMe(user.userId);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = SetupProfileSchema.parse(body);
    return this.authService.setupProfile(user.userId, validated);
  }
}
