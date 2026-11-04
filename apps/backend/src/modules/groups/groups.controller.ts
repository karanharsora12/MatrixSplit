import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';
import {
  CreateGroupSchema,
  UpdateGroupSchema,
  AddGroupMemberSchema,
} from '@matrixsplit/shared';

@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  async getMyGroups(@CurrentUser() user: CurrentUserPayload) {
    return this.groupsService.getUserGroups(user.userId);
  }

  @Post()
  async createGroup(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = CreateGroupSchema.parse(body);
    return this.groupsService.createGroup(user.userId, validated);
  }

  @Get(':id')
  async getGroup(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.groupsService.getGroupById(id, user.userId);
  }

  @Patch(':id')
  async updateGroup(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = UpdateGroupSchema.parse(body);
    return this.groupsService.updateGroup(id, user.userId, validated);
  }

  @Delete(':id')
  async deleteGroup(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.groupsService.deleteGroup(id, user.userId);
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    await this.groupsService.ensureMembership(id, user.userId);
    return this.groupsService.getGroupMembers(id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any
  ) {
    const validated = AddGroupMemberSchema.parse(body);
    return this.groupsService.addMember(id, user.userId, validated.userId);
  }

  @Delete(':id/members/:memberUserId')
  async removeMember(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('memberUserId') memberUserId: string
  ) {
    return this.groupsService.removeMember(id, user.userId, memberUserId);
  }

  @Post('join/:inviteCode')
  async joinGroup(
    @Param('inviteCode') inviteCode: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.groupsService.joinGroupByInviteCode(inviteCode, user.userId);
  }
}
