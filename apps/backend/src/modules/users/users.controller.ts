import { Controller, Get, Query, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  async search(
    @Query('q') query: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.usersService.searchUsers(query, user.userId);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Delete('me')
  async deleteMyAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.deleteAccount(user.userId);
  }
}
