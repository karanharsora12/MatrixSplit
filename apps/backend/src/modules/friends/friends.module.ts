import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { EventsGateway } from '../../gateway/events.gateway';

@Module({
  controllers: [FriendsController],
  providers: [FriendsService, EventsGateway],
  exports: [FriendsService],
})
export class FriendsModule {}
