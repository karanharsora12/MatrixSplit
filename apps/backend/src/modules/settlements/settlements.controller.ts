import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';
import {
  CreateSettlementSchema,
  ConfirmSettlementSchema,
} from '@matrixsplit/shared';

@Controller('settlements')
export class SettlementsController {
  constructor(private settlementsService: SettlementsService) {}

  @Post()
  async createSettlement(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = CreateSettlementSchema.parse(body);
    return this.settlementsService.createSettlement(user.userId, validated);
  }

  @Patch(':id/confirm')
  async confirmSettlement(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = ConfirmSettlementSchema.parse(body);
    return this.settlementsService.confirmSettlement(id, user.userId, validated);
  }

  @Get('recent')
  async getRecent(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string
  ) {
    return this.settlementsService.getRecentSettlements(
      user.userId,
      limit ? parseInt(limit, 10) : 10
    );
  }

  @Get(':id')
  async getSettlement(@Param('id') id: string) {
    return this.settlementsService.getSettlementById(id);
  }
}
