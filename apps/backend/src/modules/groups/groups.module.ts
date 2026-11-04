import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { EventsGateway } from '../../gateway/events.gateway';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, EventsGateway],
  exports: [GroupsService],
})
export class GroupsModule {}
