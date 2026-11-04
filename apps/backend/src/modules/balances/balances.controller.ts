import { Controller, Get, Param } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';

@Controller('balances')
export class BalancesController {
  constructor(private balancesService: BalancesService) {}

  @Get('overview')
  async getOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.balancesService.getUserBalanceOverview(user.userId);
  }

  @Get('group/:groupId')
  async getGroupBalances(
    @Param('groupId') groupId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.balancesService.getGroupBalances(groupId, user.userId);
  }
}
