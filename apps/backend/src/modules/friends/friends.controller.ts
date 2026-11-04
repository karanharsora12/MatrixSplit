import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';
import {
  SendFriendRequestSchema,
  RespondFriendRequestSchema,
} from '@matrixsplit/shared';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Get()
  async getFriends(@CurrentUser() user: CurrentUserPayload) {
    return this.friendsService.getFriends(user.userId);
  }

  @Get('requests/pending')
  async getPendingRequests(@CurrentUser() user: CurrentUserPayload) {
    return this.friendsService.getPendingRequests(user.userId);
  }

  @Post('request')
  async sendFriendRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = SendFriendRequestSchema.parse(body);
    return this.friendsService.sendFriendRequest(user.userId, validated.emailOrUserId);
  }

  @Post('requests/:id/respond')
  async respondToRequest(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = RespondFriendRequestSchema.parse(body);
    return this.friendsService.respondToRequest(id, user.userId, validated.action);
  }

  @Delete(':friendId')
  async removeFriend(
    @CurrentUser() user: CurrentUserPayload,
    @Param('friendId') friendId: string
  ) {
    return this.friendsService.removeFriend(user.userId, friendId);
  }
}
