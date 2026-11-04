import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';

@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  async getFeed(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string
  ) {
    return this.activitiesService.getUserFeed(
      user.userId,
      limit ? parseInt(limit, 10) : 25
    );
  }

  @Get('group/:groupId')
  async getGroupFeed(
    @Param('groupId') groupId: string,
    @Query('limit') limit?: string
  ) {
    return this.activitiesService.getGroupFeed(
      groupId,
      limit ? parseInt(limit, 10) : 25
    );
  }
}
